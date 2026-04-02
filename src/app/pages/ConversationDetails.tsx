import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";

import Sidebar from "../components/Sidebar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import UserAvatar from "../components/UserAvatar";
import {
  connectToChatSocket,
  fetchConversation,
  fetchChats,
  type ChatMessage,
  type ChatParticipant,
  type ChatSocketConnection,
} from "../lib/chat";
import { fetchChatBotInfo } from "../lib/chat-bot";
import { syncCurrentUserFromApi } from "../lib/user-session";
import { fetchUserById } from "../lib/user-directory";

type LocationState = {
  participant?: ChatParticipant;
  currentUserId?: number | null;
  participantName?: string;
};

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "HH:mm");
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM d, yyyy");
}

function appendMessage(list: ChatMessage[], message: ChatMessage) {
  if (list.some((item) => item.id === message.id)) return list;
  return [...list, message].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export default function ConversationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: userIdParam } = useParams();
  const targetUserId = Number(userIdParam);
  const locationState = (location.state ?? {}) as LocationState;

  const [currentUserId, setCurrentUserId] = useState<number | null>(locationState.currentUserId ?? null);
  const [participant, setParticipant] = useState<ChatParticipant | null>(locationState.participant ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<ChatSocketConnection | null>(null);
  const participantLabel = locationState.participantName || participant?.email || `User ${targetUserId}`;

  useEffect(() => {
    if (!Number.isFinite(targetUserId)) {
      navigate("/conversations", { replace: true });
    }
  }, [navigate, targetUserId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!Number.isFinite(targetUserId)) return;

      setLoading(true);
      setError(null);

      try {
        const botInfo = await fetchChatBotInfo().catch(() => null);
        if (botInfo?.id === targetUserId) {
          navigate("/conversations", { replace: true });
          return;
        }

        const me = await syncCurrentUserFromApi();
        const fallbackUserId = Number(localStorage.getItem("userId"));
        const resolvedCurrentUserId = locationState.currentUserId
          ?? me?.id
          ?? (Number.isFinite(fallbackUserId) ? fallbackUserId : null);

        if (!resolvedCurrentUserId) {
          throw new Error("Current user is not available. Please sign in again.");
        }

        let resolvedParticipant = locationState.participant ?? null;
        if (!resolvedParticipant) {
          const chats = await fetchChats(resolvedCurrentUserId);
          resolvedParticipant = chats.find((item) => item.id === targetUserId) ?? null;
        }

        if (!resolvedParticipant || !resolvedParticipant.avatar) {
          const fallbackUser = await fetchUserById(targetUserId).catch(() => null);
          if (fallbackUser) {
            resolvedParticipant = {
              id: resolvedParticipant?.id ?? fallbackUser.id,
              email: resolvedParticipant?.email || fallbackUser.email,
              role: resolvedParticipant?.role || fallbackUser.role,
              status: resolvedParticipant?.status || fallbackUser.status,
              avatar: resolvedParticipant?.avatar || fallbackUser.avatar || null,
            };
          }
        }

        const conversation = await fetchConversation(resolvedCurrentUserId, targetUserId);
        if (!active) return;

        setCurrentUserId(resolvedCurrentUserId);
        setParticipant(
          resolvedParticipant ?? {
            id: targetUserId,
            email: `User ${targetUserId}`,
            role: "UNKNOWN",
            status: "UNKNOWN",
            avatar: null,
          },
        );
        setMessages(conversation);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load conversation.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [locationState.currentUserId, locationState.participant, navigate, targetUserId]);

  useEffect(() => {
    if (!currentUserId || !Number.isFinite(targetUserId)) return;

    let active = true;

    void (async () => {
      try {
        const connection = await connectToChatSocket({
          onMessage: (incoming) => {
            const isRelevant =
              (incoming.senderId === currentUserId && incoming.recipientId === targetUserId) ||
              (incoming.senderId === targetUserId && incoming.recipientId === currentUserId);
            if (!isRelevant) return;

            setMessages((prev) => appendMessage(prev, incoming));
          },
          onError: (message) => {
            setSocketError(message);
          },
        });

        if (!active) {
          connection.disconnect();
          return;
        }

        socketRef.current = connection;
      } catch (err: any) {
        if (!active) return;
        setSocketError(err?.message || "Failed to connect to chat.");
      }
    })();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  const groupedDate = useMemo(() => {
    const first = messages[0];
    return first ? formatConversationDate(first.createdAt) : "";
  }, [messages]);

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content || !currentUserId || !participant || !socketRef.current) return;

    try {
      setSending(true);
      setSocketError(null);
      socketRef.current.send(participant.id, content);
      setMessageText("");
    } catch (err: any) {
      setSocketError(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col">
          <div className="mb-5 flex items-center gap-3">
            <Link to="/conversations">
              <Button type="button" variant="outline" className="border-gray-200">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-5">
              {participant && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      avatar={participant.avatar}
                      label={participantLabel}
                      className="h-12 w-12 rounded-xl"
                      fallbackClassName="rounded-xl bg-[#1E3A8A] text-sm font-semibold text-white"
                    />

                    <div>
                      <div className="font-semibold text-gray-900">{participantLabel}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        <span>{participant.role}</span>
                        <span className="text-gray-300">|</span>
                        <span>User ID: {participant.id}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className={participant.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : ""}
                  >
                    {participant.status}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-[#F9FAFB]">
              {loading && <div className="p-6 text-gray-600">Loading conversation...</div>}
              {!loading && error && <div className="p-6 text-red-700">{error}</div>}

              {!loading && !error && (
                <>
                  <ScrollArea className="min-h-0 flex-1">
                    <div ref={scrollerRef} className="h-full overflow-y-auto p-6">
                      {groupedDate && (
                        <div className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                          {groupedDate}
                        </div>
                      )}

                      <div className="space-y-4">
                        {messages.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
                            No messages yet. Start the conversation below.
                          </div>
                        )}

                        {messages.map((message) => {
                          const isOwn = message.senderId === currentUserId;

                          return (
                            <div key={`${message.id}-${message.createdAt}`} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                  isOwn
                                    ? "rounded-br-md bg-[#1E3A8A] text-white"
                                    : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
                                }`}
                              >
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                <div
                                  className={`mt-2 flex items-center justify-end gap-2 text-xs ${
                                    isOwn ? "text-blue-200" : "text-gray-500"
                                  }`}
                                >
                                  <span>{formatMessageTime(message.createdAt)}</span>
                                  <span>{message.messageStatus}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="border-t border-gray-200 bg-white p-5">
                    {socketError && (
                      <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {socketError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-[#F9FAFB]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={sending || !messageText.trim()}
                        className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
