import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Search } from "lucide-react";

import Sidebar from "../components/Sidebar";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import UserAvatar from "../components/UserAvatar";
import { fetchChats, type ChatParticipant } from "../lib/chat";
import { fetchChatBotInfo } from "../lib/chat-bot";
import { syncCurrentUserFromApi } from "../lib/user-session";
import { fetchAvatarByRoleAndUserId, fetchUserById } from "../lib/user-directory";

function getRoleLabel(role: string) {
  return role === "COMPANY" ? "Company" : role === "CREATOR" ? "Creator" : role;
}

export default function Conversations() {
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const me = await syncCurrentUserFromApi();
        const fallbackUserId = Number(localStorage.getItem("userId"));
        const userId = me?.id ?? (Number.isFinite(fallbackUserId) ? fallbackUserId : null);

        if (!userId) {
          throw new Error("Current user is not available. Please sign in again.");
        }

        const [list, bot] = await Promise.all([
          fetchChats(userId),
          fetchChatBotInfo().catch(() => null),
        ]);
        if (!active) return;

        const filteredList = bot ? list.filter((item) => item.id !== bot.id) : list;
        const missingAvatarParticipants = filteredList.filter((item) => !item.avatar);

        const fallbackUsers = await Promise.all(
          missingAvatarParticipants.map(async (participant) => {
            try {
              const [basicUser, profileAvatar] = await Promise.all([
                fetchUserById(participant.id).catch(() => null),
                fetchAvatarByRoleAndUserId(participant.id, participant.role).catch(() => null),
              ]);
              return [participant.id, { basicUser, profileAvatar }] as const;
            } catch {
              return [participant.id, null] as const;
            }
          }),
        );
        if (!active) return;

        const fallbackById = fallbackUsers.reduce<
          Record<number, { basicUser: Awaited<ReturnType<typeof fetchUserById>>; profileAvatar: string | null } | null>
        >(
          (acc, [participantId, profile]) => {
            acc[participantId] = profile;
            return acc;
          },
          {},
        );

        setCurrentUserId(userId);
        setChats(
          filteredList.map((item) => {
            const fallbackProfile = fallbackById[item.id];
            return {
              ...item,
              email: fallbackProfile?.basicUser?.email || item.email,
              role: fallbackProfile?.basicUser?.role || item.role,
              status: fallbackProfile?.basicUser?.status || item.status,
              avatar: item.avatar || fallbackProfile?.profileAvatar || fallbackProfile?.basicUser?.avatar || null,
            };
          }),
        );
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load chats.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat) => {
      return (
        chat.email.toLowerCase().includes(query) ||
        chat.role.toLowerCase().includes(query) ||
        String(chat.id).includes(query)
      );
    });
  }, [chats, search]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
            <p className="mt-2 text-gray-600">
              Open a chat to view message history and continue the conversation in real time.
            </p>
          </div>

          <Card className="overflow-hidden border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email, role, or ID..."
                  className="bg-[#F9FAFB] pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="p-4">
                {loading && (
                  <div className="rounded-xl border border-gray-200 bg-[#F9FAFB] p-10 text-center text-gray-600">
                    Loading chats...
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
                )}

                {!loading && !error && filteredChats.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-[#F9FAFB] p-10 text-center">
                    <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                    <p className="font-medium text-gray-900">No conversations found</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {search ? "Try a different search query." : "Your chat list is currently empty."}
                    </p>
                  </div>
                )}

                {!loading && !error && filteredChats.length > 0 && (
                  <div className="space-y-3">
                    {filteredChats.map((chat) => (
                      <Link
                        key={chat.id}
                        to={`/conversations/${chat.id}`}
                        state={{ participant: chat, currentUserId }}
                        className="block"
                      >
                        <div className="rounded-2xl border border-gray-200 p-4 transition hover:border-[#3B82F6] hover:bg-[#EFF6FF]/60">
                          <div className="flex items-center gap-4">
                            <UserAvatar
                              avatar={chat.avatar}
                              label={chat.email}
                              className="h-12 w-12 rounded-xl"
                              fallbackClassName="rounded-xl bg-[#1E3A8A] text-sm font-semibold text-white"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="truncate font-semibold text-gray-900">{chat.email}</div>
                                <Badge
                                  variant="secondary"
                                  className={chat.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : ""}
                                >
                                  {chat.status}
                                </Badge>
                              </div>

                              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                <span>{getRoleLabel(chat.role)}</span>
                                <span className="text-gray-300">|</span>
                                <span>User ID: {chat.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </main>
    </div>
  );
}
