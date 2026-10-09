"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "../components/ui/sidebar";
import { ChatMessage } from "../types";
import apiClient from "@/lib/apiClient";
import { getAiChatError, aiRetrySeconds, isAiConversationControl, nextAiUsageReset, type AiChatError } from "@/lib/aiChatError";
import { subscriptionService, type SubscriptionSummary } from "@/services/subscriptionService";
import AiChatNotice from "../components/AiChatNotice";

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [clarificationId, setClarificationId] = useState<string | null>(null);
  const [clarificationType, setClarificationType] = useState<"planning" | "request">("request");
  const [walletOptions, setWalletOptions] = useState<string[]>([]);
  const [assistantEngine, setAssistantEngine] = useState<"gemini" | "fallback" | "unknown">("unknown");
  const [usage, setUsage] = useState<SubscriptionSummary | null>(null);
  const [chatError, setChatError] = useState<AiChatError | null>(null);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const requestInFlight = useRef(false);
  const usageRequest = useRef(0);
  const messagesViewportRef = useRef<HTMLDivElement>(null);

  const refreshChatUsage = useCallback(async () => {
    const request = ++usageRequest.current;
    try {
      const summary = await subscriptionService.getMine();
      if (request !== usageRequest.current) return;
      setUsage(summary);
      setChatError(current => {
        if (!summary.canWrite) return null;
        if (summary.remaining.aiRequests > 0) return current?.kind === "monthly_limit" ? null : current;
        if (current?.kind === "rate_limit" && aiRetrySeconds(current.retryAt) > 0) return current;
        return { kind: "monthly_limit", message: "Your monthly AI request limit has been reached. Check your plan or wait for the next usage period.", retryAt: null, resetAt: summary.usagePeriodEnd || nextAiUsageReset() };
      });
    } catch {
      // The chat endpoint still enforces limits if usage cannot be loaded.
    }
  }, []);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await apiClient.get("/ai/history");
        if (res.data && res.data.length > 0) {
          const loaded: ChatMessage[] = [];
          res.data.forEach((item: AiHistoryItem) => {
            loaded.push({
              id: item.id + "-q",
              role: "user",
              content: item.question,
              timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
            loaded.push({
              id: item.id + "-a",
              role: "assistant",
              content: item.answer,
              knowledgeSources: item.knowledgeSources,
              timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          });
          setMessages(loaded);
          const pending = res.data.filter((item: AiHistoryItem) => ["AWAITING_CONFIRMATION", "NEEDS_CLARIFICATION"].includes(item.state || "")).at(-1);
          setRequiresConfirmation(pending?.state === "AWAITING_CONFIRMATION");
          setConfirmationId(pending?.state === "AWAITING_CONFIRMATION" ? pending.id : null);
          setClarificationId(pending?.state === "NEEDS_CLARIFICATION" ? pending.id : null);
          setClarificationType(pending?.clarificationType === "planning" ? "planning" : "request");
          setWalletOptions(pending?.walletOptions || []);
          const latestModel = res.data.at(-1)?.model;
          setAssistantEngine(typeof latestModel === "string" && latestModel.startsWith("gemini-") ? "gemini" : latestModel ? "fallback" : "unknown");
        } else {
          // No history — show a welcome message without spending the user's quota.
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: "Hi! Ask me about your finances, plan a purchase, or ask how to use Casha-Ba.\n\nYou can reply naturally—‘I don’t get it’, ‘why?’, or ‘what should I do next?’—and I’ll continue the same topic. I’ll ask for any missing details. Changes to financial records need your confirmation.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      } catch (err) {
        console.warn("AI history is temporarily unavailable");
        const failure = getAiChatError(err);
        setChatError(failure);
        setRetrySeconds(aiRetrySeconds(failure.retryAt));
      }
    }
    void loadHistory().finally(refreshChatUsage);
    const refresh = () => void refreshChatUsage();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refreshChatUsage]);

  useEffect(() => {
    if (!chatError?.retryAt) return;
    const deadline = chatError.retryAt;
    const timer = window.setInterval(() => {
      const remaining = aiRetrySeconds(deadline);
      setRetrySeconds(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        void refreshChatUsage();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [chatError?.retryAt, refreshChatUsage]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, loading, chatError?.kind, usage?.planName]);

  async function sendMessage(text: string) {
    if (usage?.canWrite === false || !text.trim() || requestInFlight.current || aiRetrySeconds(chatError?.retryAt ?? null) > 0) return;
    const monthlyLimitReached = chatError?.kind === "monthly_limit" || usage?.remaining.aiRequests === 0;
    if (monthlyLimitReached && !isAiConversationControl(text, confirmationId)) {
      setChatError({ kind: "monthly_limit", message: "Your monthly AI request limit has been reached. Check your plan or wait for the next usage period.", retryAt: null, resetAt: usage?.usagePeriodEnd || chatError?.resetAt || nextAiUsageReset() });
      return;
    }
    requestInFlight.current = true;
    setChatError(null);
    setRetrySeconds(0);
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: currentTime,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/ai/chat", { message: text, confirmationId, clarificationId });
      const replyMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.data.content,
        knowledgeSources: res.data.knowledgeSources,
        timestamp: currentTime,
      };
      setMessages((prev) => [...prev, replyMsg]);
      setRequiresConfirmation(Boolean(res.data.requiresConfirmation));
      setConfirmationId(res.data.requiresConfirmation ? res.data.id : null);
      setClarificationId(res.data.requiresClarification ? res.data.id : null);
      setClarificationType(res.data.clarificationType === "planning" ? "planning" : "request");
      setWalletOptions(res.data.walletOptions || []);
      if (typeof res.data.model === "string") setAssistantEngine(res.data.model.startsWith("gemini-") ? "gemini" : "fallback");
    } catch (err) {
      const failure = getAiChatError(err);
      setChatError(failure);
      setRetrySeconds(aiRetrySeconds(failure.retryAt));
      setMessages(prev => prev.filter(message => message.id !== userMsg.id));
      setInput(current => current || text);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      void refreshChatUsage();
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  const fillPrompt = (text: string) => {
    setInput(text);
    setQuestionsOpen(false);
  };

  const monthlyLimitReached = chatError?.kind === "monthly_limit" || usage?.remaining.aiRequests === 0;
  const accessExpired = usage?.canWrite === false;
  const sendBlocked = accessExpired || loading || retrySeconds > 0 || (monthlyLimitReached && !isAiConversationControl(input, confirmationId));

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f7f9f8]">
      <Sidebar />
      <main className="app-main flex min-h-0 flex-col overflow-hidden">
        {/* Header */}
        <div className="app-page-header mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 pb-4">
          <h1>AI Assistant</h1>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
            {assistantEngine === "gemini" ? "✨ Powered by Gemini" : assistantEngine === "fallback" ? "Built-in assistant" : "AI Assistant"}
          </span>
        </div>

        {/* Main Content Area */}
        <p className="mb-3 shrink-0 text-xs text-gray-600">Requests handled by Gemini include your message, recent conversation and a minimized financial summary. Account and goal names are replaced where possible; avoid sharing account numbers or sensitive personal details. Savings calculations use your records and the planning amounts you provide. Review financial actions before confirming.</p>
        {usage && <p className="mb-3 shrink-0 text-xs text-gray-600" role="status">{usage.planName} plan · {usage.remaining.aiRequests} of {usage.limits.aiRequests} AI requests remaining this month{usage.remaining.aiRequests === 0 && (usage.canWrite ? ". You can still confirm or cancel an existing action." : ". Choose a paid plan to continue. Chat history remains available.")}</p>}
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-4 lg:grid-cols-4 lg:grid-rows-[minmax(0,1fr)] lg:gap-6">
          {/* Chat Window */}
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-3">
            <div ref={messagesViewportRef} role="region" aria-label="Conversation" tabIndex={0} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#f9fbf9] p-4 sm:p-6">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    {isUser ? (
                      <div className="bg-[#48a478] text-white px-5 py-3 rounded-2xl max-w-md shadow-sm text-xs font-medium flex items-end gap-3">
                        <span className="min-w-0 whitespace-pre-wrap break-words">{m.content}</span>
                        <span className="text-[10px] text-white/80 shrink-0">{m.timestamp}</span>
                      </div>
                    ) : (
                      <div className="bg-[#f0f4f1] text-gray-800 p-5 rounded-2xl w-fit max-w-[min(100%,36rem)] shadow-sm border border-gray-200/60 text-sm">
                        <div className="whitespace-pre-line break-words font-medium leading-relaxed">
                          {m.content}
                        </div>
                        {m.knowledgeSources?.length ? (
                          <details className="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-600">
                            <summary className="cursor-pointer font-semibold">Guidance sources</summary>
                            <ul className="mt-2 list-disc space-y-1 pl-4">
                              {m.knowledgeSources.map(source => <li key={source.id}>{source.source}</li>)}
                            </ul>
                          </details>
                        ) : null}
                        <div className="text-[10px] text-gray-400 mt-2 text-right">{m.timestamp}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#f0f4f1] text-gray-500 p-4 rounded-2xl text-xs italic animate-pulse">
                    Working on your question...
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="shrink-0">
            {chatError && <AiChatNotice error={chatError} retrySeconds={retrySeconds} />}
            {clarificationId && !loading && <div className="flex flex-wrap items-center gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-3">
              <span className="text-xs text-emerald-800" role="status">Waiting for your answer</span>
              {walletOptions.length > 0 && <span className="text-xs text-gray-600">Use account:</span>}
              {walletOptions.map(name => <button key={name} type="button" disabled={accessExpired || retrySeconds > 0 || monthlyLimitReached} onClick={() => sendMessage(name)} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-50">{name}</button>)}
              <button type="button" disabled={accessExpired || retrySeconds > 0} onClick={() => sendMessage("cancel")} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50">{clarificationType === "planning" ? "Cancel plan" : "Cancel request"}</button>
            </div>}
            {requiresConfirmation && !loading && <div className="flex gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3"><button type="button" disabled={accessExpired || retrySeconds > 0} onClick={() => sendMessage("confirm")} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm and save</button><button type="button" disabled={accessExpired || retrySeconds > 0} onClick={() => sendMessage("cancel")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 disabled:opacity-50">Cancel</button></div>}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3">
              <input
                aria-label="Message the AI assistant"
                disabled={accessExpired}
                maxLength={2000}
                className="min-w-0 flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ask about your finances, a savings plan, or how to use Casha-Ba..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={sendBlocked || !input.trim()}
                className="shrink-0 bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center justify-center transition"
              >
                {retrySeconds > 0 ? `${retrySeconds}s` : "➢"}
              </button>
            </form>
            </div>
          </div>

          {/* Right Info Panel */}
          <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#f4f7f5] shadow-sm text-xs" aria-label="Questions and actions">
            <button type="button" aria-expanded={questionsOpen} aria-controls="ai-questions-panel" onClick={() => setQuestionsOpen(open => !open)} className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-left font-bold text-gray-900 lg:hidden">
              Questions &amp; Actions <span aria-hidden="true">{questionsOpen ? "−" : "+"}</span>
            </button>
            <div id="ai-questions-panel" className={`${questionsOpen ? "block" : "hidden"} min-h-0 max-h-[30dvh] space-y-6 overflow-y-auto overscroll-contain p-4 lg:block lg:max-h-none lg:flex-1 lg:p-6`}>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Questions &amp; Actions</h3>
              <p className="text-gray-500 text-[11px] mb-4">Click any example to fill in prompt:</p>

              <div className="space-y-3">
                <button type="button" onClick={() => fillPrompt("Explain that in simpler terms")} className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"><p className="font-bold text-emerald-700">Explain Simply</p><p className="text-gray-500 text-[11px]">Continue the last topic with a shorter explanation.</p></button>
                <button type="button" onClick={() => fillPrompt("How do I set up a savings goal in Casha-Ba?")} className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"><p className="font-bold text-emerald-700">How to Use Casha-Ba</p><p className="text-gray-500 text-[11px]">Ask for steps using the system’s features.</p></button>
                <button type="button" onClick={() => fillPrompt("How many months will it take to buy a phone?")} className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"><p className="font-bold text-emerald-700">Savings Timeline</p><p className="text-gray-500 text-[11px]">Uses your saved goal, or asks for the price and monthly savings. Reply directly to continue the plan.</p></button>
                <button
                  type="button"
                  onClick={() => fillPrompt("Give me my daily financial brief")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">☀️ Daily Brief</p>
                  <p className="text-gray-500 text-[11px]">&quot;Give me my daily financial brief&quot;</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("Spent 150 on groceries from Cash today")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">🛒 Expense Logging</p>
                  <p className="text-gray-500 text-[11px]">&quot;Spent 150 on groceries from Cash today&quot;</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("That should be Transport not Food")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">✏️ Category Correction</p>
                  <p className="text-gray-500 text-[11px]">&quot;That should be Transport not Food&quot;</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("Save 500 to Emergency Fund from Cash today")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">🎯 Savings Allocation</p>
                  <p className="text-gray-500 text-[11px]">&quot;Save 500 to Emergency Fund from Cash today&quot;</p>
                </button>

                <button type="button" onClick={() => fillPrompt("Transfer 1000 from Cash to GCash today")} className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"><p className="font-bold text-emerald-700">Wallet Transfer</p><p className="text-gray-500 text-[11px]">&quot;Transfer 1000 from Cash to GCash today&quot;</p></button>

                <button
                  type="button"
                  onClick={() => fillPrompt("I owe 2000 to Anna due July 30")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">🤝 Debt Record</p>
                  <p className="text-gray-500 text-[11px]">&quot;I owe 2000 to Anna due July 30&quot;</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("I collected 500 from Anna")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">Loan Collection</p>
                  <p className="text-gray-500 text-[11px]">&quot;I collected 500 from Anna&quot;</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("Show my summary")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">📊 Safe-to-Spend Summary</p>
                  <p className="text-gray-500 text-[11px]">&quot;Show my summary&quot;</p>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200/80 text-[11px] text-gray-500 italic">
              AI automatically recalculates your Safe-to-Spend on every financial action.
            </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

interface AiHistoryItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  state?: string;
  model?: string;
  walletOptions?: string[];
  clarificationType?: "planning" | null;
  knowledgeSources?: ChatMessage["knowledgeSources"];
}
