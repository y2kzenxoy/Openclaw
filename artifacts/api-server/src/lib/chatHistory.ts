import { v4 as uuidv4 } from "crypto";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: string;
  toolCalls?: Array<{ tool: string; input: string; output: string }>;
  thinking?: string;
}

const messages: ChatMessage[] = [];

export function addMessage(msg: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
  const full: ChatMessage = {
    ...msg,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };
  messages.push(full);
  return full;
}

export function getHistory(): ChatMessage[] {
  return [...messages];
}

export function clearHistory(): void {
  messages.length = 0;
}

export function getGroqMessages() {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}
