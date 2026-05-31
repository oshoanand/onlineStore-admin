"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  MessageSquare,
  UserCircle,
  Search,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/useChatStore";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { clsx } from "clsx";
import { apiRequest } from "@/services/http/api-client";

interface ChatSession {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  partnerImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
}

export default function VisitorChatListScreen({
  onNavigateToDetail,
}: {
  onNavigateToDetail: (id: string) => void;
}) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const router = useRouter();

  // 1. Zustand Selectors
  const socket = useChatStore((state) => state.socket);
  const refreshTrigger = useChatStore((state) => state.refreshTrigger);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const lastSeenMap = useChatStore((state) => state.lastSeenMap);
  const setOnlineStatusBulk = useChatStore(
    (state) => state.setOnlineStatusBulk,
  );
  const decreaseUnreadCount = useChatStore(
    (state) => state.decreaseUnreadCount,
  );

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Optimized Data Fetching
  const fetchSessions = useCallback(
    async (isSilent = false) => {
      if (!userId) return;
      if (!isSilent) setLoading(true);

      try {
        // Uses your custom apiRequest which attaches the Bearer token automatically
        const data = await apiRequest<ChatSession[]>({
          method: "GET",
          url: "/notifications/chat/sessions",
        });

        // Sync Online Status and Last Seen locally to Zustand
        const currentlyOnline: string[] = [];
        const lastSeenData: Record<string, string> = {};

        data.forEach((s) => {
          if (s.isOnline) {
            currentlyOnline.push(s.partnerId);
          } else if (s.lastSeen) {
            lastSeenData[s.partnerId] = s.lastSeen;
          }
        });

        setOnlineStatusBulk(currentlyOnline, lastSeenData);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    },
    [userId, setOnlineStatusBulk],
  );

  useEffect(() => {
    fetchSessions(sessions.length > 0);
  }, [fetchSessions, refreshTrigger, sessions.length]);

  // 3. REAL-TIME SOCKET SYNC
  useEffect(() => {
    if (!socket || !userId) return;

    const handleSilentRefresh = () => {
      fetchSessions(true);
    };

    socket.on("receive_message", handleSilentRefresh);
    socket.on("read_status_synced", handleSilentRefresh);
    socket.on("messages_read_by_recipient", handleSilentRefresh);

    return () => {
      socket.off("receive_message", handleSilentRefresh);
      socket.off("read_status_synced", handleSilentRefresh);
      socket.off("messages_read_by_recipient", handleSilentRefresh);
    };
  }, [socket, userId, fetchSessions]);

  // 4. Simple Search Logic
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) =>
      s.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sessions, searchQuery]);

  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="p-4 border-b sticky top-0 bg-background/90 backdrop-blur-md z-10 shadow-sm flex flex-col gap-4 pt-safe">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="md:hidden p-2 -ml-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Чаты</h1>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Поиск собеседника..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 rounded-full py-2.5 pl-11 pr-4 text-[15px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all border border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-muted-foreground">
            <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
            <p className="text-base font-medium">Чаты не найдены</p>
          </div>
        ) : (
          filteredSessions.map((chat) => (
            <ChatListItem
              key={chat.partnerId}
              chat={chat}
              // 🚨 FIX: Correct usage of Record mapping for high-performance online status check
              isOnline={onlineUsers[chat.partnerId] === true}
              realTimeLastSeen={lastSeenMap[chat.partnerId]}
              onClick={() => {
                decreaseUnreadCount(chat.unreadCount);

                // Optimistically clear the unread count in the list UI
                setSessions((prev) =>
                  prev.map((s) =>
                    s.partnerId === chat.partnerId
                      ? { ...s, unreadCount: 0 }
                      : s,
                  ),
                );

                onNavigateToDetail(chat.partnerId);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: CHAT ITEM ---
function ChatListItem({
  chat,
  isOnline,
  realTimeLastSeen,
  onClick,
}: {
  chat: ChatSession;
  isOnline: boolean;
  realTimeLastSeen?: string;
  onClick: () => void;
}) {
  // const lastActive = realTimeLastSeen || chat.lastSeen || chat.lastMessageTime;
  const lastActive = realTimeLastSeen || chat.lastSeen;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer group"
    >
      <div className="relative shrink-0">
        <div
          className={clsx(
            "w-14 h-14 rounded-full overflow-hidden border-2 transition-all shadow-sm",
            isOnline
              ? "border-green-500 ring-2 ring-green-500/20"
              : "border-border",
          )}
        >
          {chat.partnerImage ? (
            <img
              src={chat.partnerImage}
              className="w-full h-full object-cover"
              alt={chat.partnerName}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
        </div>
        {isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-bold text-[16px] text-foreground truncate group-active:text-primary transition-colors">
            {chat.partnerName}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-0.5">
          {isOnline ? (
            <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{" "}
              В сети
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Был(а){" "}
              {lastActive
                ? formatDistanceToNow(new Date(lastActive), {
                    addSuffix: true,
                    locale: ru,
                  })
                : "недавно"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p
            className={clsx(
              "text-[14px] truncate flex-1",
              chat.unreadCount > 0
                ? "text-foreground font-semibold"
                : "text-muted-foreground",
            )}
          >
            {chat.lastMessage}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[11px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shrink-0">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
