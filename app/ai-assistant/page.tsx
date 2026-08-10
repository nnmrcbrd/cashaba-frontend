"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/ui/sidebar";
import { ChatMessage } from "../types";
import apiClient from "@/lib/apiClient";

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
          res.data.forEach((item: any) => {
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
        } else {
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: currentTime,
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/ai/chat", { message: currentInput });
      const replyMsg: ChatMessage = {
        id: res.data.id || crypto.randomUUID(),
        role: "assistant",
        content: res.data.content,
        timestamp: currentTime,
      };
      setMessages((prev) => [...prev, replyMsg]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I had trouble processing that request. Please try again.",
          timestamp: currentTime,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const fillPrompt = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200/60 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">AI ASSISTANT</h1>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
            ✨ Powered by Gemini
          </span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Chat Window */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-180px)] overflow-hidden">
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
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3">
              <input
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ask AI or log expense (e.g. Spent 150 on groceries)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center justify-center transition"
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
                  onClick={() => fillPrompt("Spent 150 on groceries")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">🛒 Expense Logging</p>
                  <p className="text-gray-500 text-[11px]">"Spent 150 on groceries"</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("That should be Transport not Food")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">✏️ Category Correction</p>
                  <p className="text-gray-500 text-[11px]">"That should be Transport not Food"</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("Add 500 to Emergency Fund")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">🎯 Savings Allocation</p>
                  <p className="text-gray-500 text-[11px]">"Add 500 to Emergency Fund"</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("I owe 2000 to Anna due July 30")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">🤝 Debt Record</p>
                  <p className="text-gray-500 text-[11px]">"I owe 2000 to Anna due July 30"</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPrompt("Show my summary")}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition"
                >
                  <p className="font-bold text-emerald-700">📊 Safe-to-Spend Summary</p>
                  <p className="text-gray-500 text-[11px]">"Show my summary"</p>
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