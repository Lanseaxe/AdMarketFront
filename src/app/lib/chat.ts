import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "./api-client";
import { getAccessToken } from "./auth-storage";

export type ChatParticipant = {
  id: number;
  email: string;
  role: "COMPANY" | "CREATOR" | string;
  status: "ACTIVE" | string;
};

export type ChatMessage = {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  messageStatus: "SENT" | "DELIVERED" | "READ" | string;
  createdAt: string;
};

type StompClientLike = {
  connected?: boolean;
  disconnect: (callback?: () => void) => void;
  subscribe: (destination: string, callback: (message: { body: string }) => void) => { unsubscribe: () => void };
  send: (destination: string, headers?: Record<string, string>, body?: string) => void;
};

type SocketConnection = {
  send: (recipientId: number, content: string) => void;
  disconnect: () => void;
};

export type ChatSocketConnection = SocketConnection;

function ensureBrowserGlobal() {
  if (typeof globalThis === "undefined") return;
  if (!("global" in globalThis)) {
    (globalThis as typeof globalThis & { global?: typeof globalThis }).global = globalThis;
  }
}

function requireApiBase() {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
  return apiBase;
}

function ensureParticipant(data: unknown): ChatParticipant | null {
  if (!data || typeof data !== "object") return null;
  const item = data as Partial<ChatParticipant>;
  if (
    typeof item.id !== "number" ||
    typeof item.email !== "string" ||
    typeof item.role !== "string" ||
    typeof item.status !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    email: item.email,
    role: item.role,
    status: item.status,
  };
}

function ensureMessage(data: unknown): ChatMessage | null {
  if (!data || typeof data !== "object") return null;
  const item = data as Partial<ChatMessage>;
  if (
    typeof item.id !== "number" ||
    typeof item.senderId !== "number" ||
    typeof item.recipientId !== "number" ||
    typeof item.content !== "string" ||
    typeof item.messageStatus !== "string" ||
    typeof item.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    senderId: item.senderId,
    recipientId: item.recipientId,
    content: item.content,
    messageStatus: item.messageStatus,
    createdAt: item.createdAt,
  };
}

export async function fetchChats(userId: number): Promise<ChatParticipant[]> {
  const apiBase = requireApiBase();
  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/message/chats/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (!res.ok) {
    throw new Error(`Failed to load chats (HTTP ${res.status})`);
  }
  if (!Array.isArray(data)) {
    throw new Error("Invalid chats response from backend.");
  }

  return data.map(ensureParticipant).filter((item): item is ChatParticipant => Boolean(item));
}

export async function fetchConversation(user1Id: number, user2Id: number): Promise<ChatMessage[]> {
  const apiBase = requireApiBase();
  const params = new URLSearchParams({
    user1Id: String(user1Id),
    user2Id: String(user2Id),
  });

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/message/conversation?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (!res.ok) {
    throw new Error(`Failed to load conversation (HTTP ${res.status})`);
  }
  if (!Array.isArray(data)) {
    throw new Error("Invalid conversation response from backend.");
  }

  return data
    .map(ensureMessage)
    .filter((item): item is ChatMessage => Boolean(item))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function buildWebsocketUrl(apiBase: string) {
  const url = new URL(apiBase);
  url.protocol = url.protocol === "https:" ? "https:" : "http:";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/ws-chat`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export async function connectToChatSocket(options: {
  onConnect?: () => void;
  onMessage: (message: ChatMessage) => void;
  onError?: (message: string) => void;
}): Promise<SocketConnection> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("You need to sign in before opening chat.");
  }

  const apiBase = requireApiBase();
  ensureBrowserGlobal();
  const [{ default: SockJS }, stompModule] = await Promise.all([
    import("sockjs-client"),
    import("stompjs/lib/stomp.js"),
  ]);
  const Stomp = (
    stompModule as {
      Stomp?: { over: (socket: unknown) => StompClientLike };
      default?: { Stomp?: { over: (socket: unknown) => StompClientLike } };
    }
  ).Stomp ?? (
    stompModule as {
      default?: { Stomp?: { over: (socket: unknown) => StompClientLike } };
    }
  ).default?.Stomp;
  if (!Stomp?.over) {
    throw new Error("Failed to initialize the STOMP client in the browser.");
  }
  const socket = new SockJS(buildWebsocketUrl(apiBase));
  const stompClient = Stomp.over(socket) as StompClientLike & { debug?: ((value: string) => void) | null };
  stompClient.debug = null;

  let subscription: { unsubscribe: () => void } | null = null;

  stompClient.connect(
    { Authorization: `Bearer ${token}` },
    () => {
      subscription = stompClient.subscribe("/user/queue/messages", (frame) => {
        try {
          const parsed = ensureMessage(JSON.parse(frame.body));
          if (parsed) {
            options.onMessage(parsed);
          }
        } catch {
          options.onError?.("Received an invalid real-time message payload.");
        }
      });

      options.onConnect?.();
    },
    (error: string) => {
      options.onError?.(typeof error === "string" ? error : "WebSocket connection failed.");
    },
  );

  return {
    send(recipientId: number, content: string) {
      stompClient.send(
        "/app/chat.send",
        {},
        JSON.stringify({
          recipientId,
          content,
        }),
      );
    },
    disconnect() {
      subscription?.unsubscribe();
      if (stompClient.connected) {
        stompClient.disconnect();
      }
    },
  };
}
