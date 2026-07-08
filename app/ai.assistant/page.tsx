"use client";

import { useState } from "react";
import Sidebar from "../components/ui/sidebar";
import { ChatMessage } from "../types";

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! Ask me anything about your budget or spending habits.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg.content }),
    });
    const reply = await res.json();
    setMessages((prev) => [...prev, reply]);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col bg-gray-50 p-8">
        <h1 className="text-2xl font-bold text-brand-900">AI Assistant</h1>
        <p className="mb-6 text-sm text-gray-500">Your personal finance co-pilot.</p>

        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white">
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400">Thinking...</div>}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-4">
            <input
              className="input"
              placeholder="Ask about your spending..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn-primary w-auto px-6" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}