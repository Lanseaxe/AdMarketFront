import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { Bot, MessageCircle, Minus, Send, X } from "lucide-react";
import { format } from "date-fns";

import UserAvatar from "./UserAvatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { connectToChatSocket, fetchConversation, type ChatMessage, type ChatSocketConnection } from "../lib/chat";
import { getAccessToken } from "../lib/auth-storage";
import { fetchChatBotInfo, type ChatBotInfo } from "../lib/chat-bot";
import { syncCurrentUserFromApi } from "../lib/user-session";

const HIDDEN_PATHS = [
  "/",
  "/signin",
  "/signup",
  "/forgot-password",
  "/forgot-password/reset",
  "/confirm-email",
  "/payment/success",
  "/payment/failed",
];

function appendMessage(list: ChatMessage[], message: ChatMessage) {
  if (list.some((item) => item.id === message.id)) return list;
  return [...list, message].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "HH:mm");
}

export default function BotChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [bot, setBot] = useState<ChatBotInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<ChatSocketConnection | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const shouldHide = useMemo(() => {
    if (!getAccessToken()) return true;
    return HIDDEN_PATHS.includes(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    setUnreadCount(0);
  }, [open]);

  useEffect(() => {
    if (shouldHide) {
      setOpen(false);
      return;
    }

    let active = true;

    void (async () => {
      try {
        const me = await syncCurrentUserFromApi();
        const botInfo = await fetchChatBotInfo();
        if (!active) return;

        setCurrentUserId(me?.id ?? null);
        setBot(botInfo);

        if (me?.id && botInfo?.id) {
          setLoading(true);
          const history = await fetchConversation(me.id, botInfo.id);
          if (!active) return;
          setMessages(history);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load bot chat.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [shouldHide]);

  useEffect(() => {
    if (shouldHide || !currentUserId || !bot?.id) return;

    let active = true;

    void (async () => {
      try {
        const connection = await connectToChatSocket({
          onMessage: (incoming) => {
            const isRelevant =
              (incoming.senderId === currentUserId && incoming.recipientId === bot.id) ||
              (incoming.senderId === bot.id && incoming.recipientId === currentUserId);
            if (!isRelevant) return;

            setMessages((prev) => appendMessage(prev, incoming));
            if (!open && incoming.senderId === bot.id) {
              setUnreadCount((prev) => prev + 1);
            }
          },
          onError: (message) => setError(message),
        });

        if (!active) {
          connection.disconnect();
          return;
        }

        socketRef.current = connection;
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to connect to bot chat.");
      }
    })();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [shouldHide, currentUserId, bot?.id, open]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, open]);

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content || !bot || !socketRef.current) return;

    try {
      setSending(true);
      setError(null);
      socketRef.current.send(bot.id, content);
      setMessageText("");
    } catch (err: any) {
      setError(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (shouldHide || !bot || !currentUserId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <Card className="flex h-[34rem] w-[24rem] flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-[#0F172A] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatar={bot.avatar}
                label={bot.name}
                className="h-10 w-10 rounded-xl"
                fallbackClassName="rounded-xl bg-white/20 text-sm font-semibold text-white"
              />
              <div>
                <div className="font-semibold">{bot.name}</div>
                <div className="text-xs text-slate-300">Quick help inside AdMarket</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setOpen(false);
                  setUnreadCount(0);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[#F8FAFC]">
            {loading && <div className="p-4 text-sm text-gray-600">Loading bot chat...</div>}

            {!loading && (
              <>
                <ScrollArea className="min-h-0 flex-1">
                  <div ref={scrollerRef} className="space-y-3 p-4">
                    {messages.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                        Ask a question and the bot will answer here.
                      </div>
                    )}

                    {messages.map((message) => {
                      const isOwn = message.senderId === currentUserId;

                      return (
                        <div key={`${message.id}-${message.createdAt}`} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                              isOwn
                                ? "rounded-br-md bg-[#1E3A8A] text-white"
                                : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <div className={`mt-2 text-right text-[11px] ${isOwn ? "text-blue-200" : "text-gray-500"}`}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="border-t border-gray-200 bg-white p-4">
                  {error && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Ask the bot..."
                      className="bg-[#F8FAFC]"
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
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#1E3A8A] text-white shadow-xl transition hover:bg-[#1E3A8A]/90"
          aria-label="Open bot chat"
        >
          <Bot className="h-7 w-7" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-xs font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="absolute -left-2 top-1/2 hidden -translate-y-1/2 -translate-x-full rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white md:block">
            Chat with bot
          </span>
          <MessageCircle className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-white p-0.5 text-[#1E3A8A]" />
        </button>
      )}
    </div>
  );
}
