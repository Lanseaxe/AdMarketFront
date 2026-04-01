import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "./api-client";
import type { ChatParticipant } from "./chat";

export type ChatBotInfo = ChatParticipant & {
  name: string;
};

function requireApiBase() {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
  return apiBase;
}

function normalizeChatBotInfo(data: unknown): ChatBotInfo | null {
  if (typeof data === "number" && Number.isFinite(data)) {
    return {
      id: data,
      email: "bot@admarket.local",
      role: "BOT",
      status: "ACTIVE",
      avatar: null,
      name: "AdMarket Bot",
    };
  }

  if (!data || typeof data !== "object") return null;
  const item = data as Record<string, unknown>;
  const id = typeof item.id === "number" ? item.id : null;
  if (!id) return null;

  const email = typeof item.email === "string" && item.email.trim() ? item.email : "bot@admarket.local";
  const name =
    (typeof item.name === "string" && item.name.trim()) ||
    (typeof item.displayName === "string" && item.displayName.trim()) ||
    (typeof item.username === "string" && item.username.trim()) ||
    "AdMarket Bot";

  return {
    id,
    email,
    role: typeof item.role === "string" ? item.role : "BOT",
    status: typeof item.status === "string" ? item.status : "ACTIVE",
    avatar: typeof item.avatar === "string" ? item.avatar : null,
    name,
  };
}

export async function fetchChatBotInfo(): Promise<ChatBotInfo | null> {
  const apiBase = requireApiBase();
  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/chat-widget/bot-info`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load chat bot info (HTTP ${res.status})`);
  }

  return normalizeChatBotInfo(data);
}
