// services/chatService.ts

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const sendMessage = async (messages: ChatMessage[]): Promise<string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("casha_access_token") : null;
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Unable to send chat message");
  return data.content;
};
