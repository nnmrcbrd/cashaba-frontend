// services/chatService.ts

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const sendMessage = async (messages: ChatMessage[]): Promise<string> => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();
  return data.reply;
};