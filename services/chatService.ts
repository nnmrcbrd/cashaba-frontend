import apiClient from "@/lib/apiClient";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const sendMessage = async (messages: ChatMessage[]): Promise<string> => {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  if (!latest) throw new Error("A user message is required");
  const response = await apiClient.post("/ai/chat", { message: latest.content });
  return response.data.content;
};
