"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/ui/sidebar";
import { ChatMessage } from "../types";
import apiClient from "@/lib/apiClient";
import axios from "axios";

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [assistantEngine, setAssistantEngine] = useState<"gemini" | "fallback" | "unknown">("unknown");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
              timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          });
          setMessages(loaded);
          setRequiresConfirmation(res.data.at(-1)?.state === "AWAITING_CONFIRMATION");
          setConfirmationId(res.data.at(-1)?.state === "AWAITING_CONFIRMATION" ? res.data.at(-1).id : null);
          const latestModel = res.data.at(-1)?.model;
          setAssistantEngine(typeof latestModel === "string" && latestModel.startsWith("gemini-") ? "gemini" : latestModel ? "fallback" : "unknown");
        } else {
          // No history — show a welcome message without spending the user's quota.
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: "👋 Hello! I am your CASHA-BA AI Assistant.\nTry asking me to log expenses, record savings, log debts, or view your Safe-to-Spend summary!",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load AI history", err);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
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
      const res = await apiClient.post("/ai/chat", { message: text, confirmationId });
      const replyMsg: ChatMessage = {
        id: res.data.id || crypto.randomUUID(),
        role: "assistant",
        content: res.data.content,
        timestamp: currentTime,
      };
      setMessages((prev) => [...prev, replyMsg]);
      setRequiresConfirmation(Boolean(res.data.requiresConfirmation));
      setConfirmationId(res.data.requiresConfirmation ? res.data.id : null);
      if (typeof res.data.model === "string") setAssistantEngine(res.data.model.startsWith("gemini-") ? "gemini" : "fallback");
    } catch (err) {
      console.error("AI Error:", err);
      const responseMessage = axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : null;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseMessage || "I couldn't process that request. Please check the details and try again.",
          timestamp: currentTime,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  const fillPrompt = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex min-h-screen bg-[#f7f9f8]">
      <Sidebar />
      <main className="app-main flex flex-col">
        {/* Header */}
        <div className="app-page-header mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 pb-4">
          <h1>AI Assistant</h1>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
            {assistantEngine === "gemini" ? "✨ Powered by Gemini" : assistantEngine === "fallback" ? "Built-in assistant" : "AI Assistant"}
          </span>
        </div>

        {/* Main Content Area */}
        <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-6 lg:grid-cols-4">
          {/* Chat Window */}
          <div className="flex h-[70vh] min-h-[32rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-3 lg:h-[calc(100vh-180px)]">
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-[#f9fbf9]">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    {isUser ? (
                      <div className="bg-[#48a478] text-white px-5 py-3 rounded-2xl max-w-md shadow-sm text-xs font-medium flex items-end gap-3">
                        <span>{m.content}</span>
                        <span className="text-[10px] text-white/80 shrink-0">{m.timestamp}</span>
                      </div>
                    ) : (
                      <div className="bg-[#f0f4f1] text-gray-800 p-5 rounded-2xl max-w-md shadow-sm border border-gray-200/60 text-xs">
                        <div className="whitespace-pre-line font-medium leading-relaxed">
                          {m.content}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-2 text-right">{m.timestamp}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#f0f4f1] text-gray-500 p-4 rounded-2xl text-xs italic animate-pulse">
                    AI is analyzing your command...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            {requiresConfirmation && !loading && <div className="flex gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3"><button type="button" onClick={() => sendMessage("confirm")} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Confirm and save</button><button type="button" onClick={() => sendMessage("cancel")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700">Cancel</button></div>}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3">
              <input
                className="min-w-0 flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ask AI or log expense (e.g. Spent 150 on groceries)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="shrink-0 bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center justify-center transition"
              >
                ➢
              </button>
            </form>
          </div>

          {/* Right Info Panel */}
          <div className="bg-[#f4f7f5] p-6 rounded-2xl border border-gray-200 shadow-sm text-xs space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Command Examples</h3>
              <p className="text-gray-500 text-[11px] mb-4">Click any example to fill in prompt:</p>

              <div className="space-y-3">
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
}
