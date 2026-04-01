import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "./api-client";
import { getAccessToken } from "./auth-storage";

export type ChatParticipant = {
  id: number;
  email: string;
  role: "COMPANY" | "CREATOR" | string;
  status: "ACTIVE" | string;
  avatar?: string | null;
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
  activate: () => void;
  deactivate: () => Promise<void>;
  publish: (options: { destination: string; body: string }) => void;
  subscribe: (destination: string, callback: (message: { body: string }) => void) => { unsubscribe: () => void };
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
    avatar: typeof item.avatar === "string" ? item.avatar : null,
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
    import("@stomp/stompjs"),
  ]);
  const ClientCtor = (
    stompModule as {
      Client?: new (config: {
        webSocketFactory: () => unknown;
        connectHeaders: Record<string, string>;
        reconnectDelay: number;
        debug: (message: string) => void;
        onConnect: () => void;
        onStompError: (frame: { headers?: Record<string, string>; body?: string }) => void;
        onWebSocketError: () => void;
      }) => StompClientLike;
      default?: {
        Client?: new (config: {
          webSocketFactory: () => unknown;
          connectHeaders: Record<string, string>;
          reconnectDelay: number;
          debug: (message: string) => void;
          onConnect: () => void;
          onStompError: (frame: { headers?: Record<string, string>; body?: string }) => void;
          onWebSocketError: () => void;
        }) => StompClientLike;
      };
    }
  ).Client ?? (
    stompModule as {
      default?: {
        Client?: new (config: {
          webSocketFactory: () => unknown;
          connectHeaders: Record<string, string>;
          reconnectDelay: number;
          debug: (message: string) => void;
          onConnect: () => void;
          onStompError: (frame: { headers?: Record<string, string>; body?: string }) => void;
          onWebSocketError: () => void;
        }) => StompClientLike;
      };
    }
  ).default?.Client;
  if (!ClientCtor) {
    throw new Error("Failed to initialize the STOMP client in the browser.");
  }
  let subscription: { unsubscribe: () => void } | null = null;
  const stompClient = new ClientCtor({
    webSocketFactory: () => new SockJS(buildWebsocketUrl(apiBase)),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 0,
    debug: () => {},
    onConnect: () => {
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
    onStompError: (frame) => {
      options.onError?.(frame.headers?.message || frame.body || "WebSocket connection failed.");
    },
    onWebSocketError: () => {
      // SockJS may emit transient WebSocket errors before falling back to a working transport.
      // We surface only STOMP-level failures and connection setup exceptions to avoid false alarms.
    },
  });

  stompClient.activate();

  return {
    send(recipientId: number, content: string) {
      stompClient.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          recipientId,
          content,
        }),
      });
    },
    disconnect() {
      subscription?.unsubscribe();
      void stompClient.deactivate();
    },
  };
}
