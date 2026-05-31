"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Hooks & Store
import { useChatStore } from "@/store/useChatStore";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { useChatSocketSync } from "@/hooks/useChatSocketSync";
import { apiRequest } from "@/services/http/api-client";

// Extracted UI Components
import {
  ChatHeader,
  ChatBubble,
  ChatContextMenu,
} from "@/components/chat/ChatUIComponents";
import { ConnectionStatusBar } from "@/components/chat/ConnectionStatusBar"; // 🚨 Added Premium UI Component

export default function ChatDetailScreen({
  partnerId,
  partnerName,
  onBack,
}: {
  partnerId: string;
  partnerName: string;
  onBack: () => void;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const queryClient = useQueryClient();

  // --- GLOBAL STATE (Zustand) ---
  const socket = useChatStore((state) => state.socket);
  const isSocketConnected = useChatStore((state) => state.isSocketConnected); // 🚨 Added for Input Guards
  const refreshTrigger = useChatStore((state) => state.refreshTrigger); // 🚨 Added for React Query Sync
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const typingUser = useChatStore((state) => state.typingUser);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const lastSeenMap = useChatStore((state) => state.lastSeenMap);
  const syncUnreadCount = useChatStore((state) => state.syncUnreadCount);

  // --- LOCAL STATE ---
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Context Menu State
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // --- REFS ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA FETCHING & SYNC ---
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChatHistory(userId, partnerId);

  // 🚨 CRITICAL FIX: Sync React Query cache with Zustand Socket Events to remove optimistic spinners
  useEffect(() => {
    if (refreshTrigger > 0) {
      const queryKeyVariants = [
        ["chatHistory", partnerId],
        ["chatHistory", userId, partnerId],
      ];
      queryKeyVariants.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }
  }, [refreshTrigger, queryClient, partnerId, userId]);

  // 🚨 ROBUST PARSING & SORTING 🚨
  const allMessages = useMemo(() => {
    if (!data?.pages) return [];

    const rawMessages = data.pages.flatMap(
      (page: any) => page?.messages || page || [],
    );

    const validMessages = rawMessages.filter(
      (m: any) => m && m.id && m.createdAt,
    );

    return validMessages.sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [data]);

  const { ref: topSentinel, inView } = useInView({ threshold: 0 });

  // Activate custom Socket Sync hook
  useChatSocketSync(socket, userId, partnerId);

  // Ensure connection & set active chat
  // 🚨 CRITICAL FIX: Only set active chat. Let SocketProvider handle the connection.
  useEffect(() => {
    if (userId && isSocketConnected) {
      setActiveChat(partnerId);
    }
    return () => setActiveChat(null);
  }, [userId, partnerId, setActiveChat, isSocketConnected]);

  // Pagination trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Smooth auto-scroll
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  // Scroll when new messages arrive
  useEffect(() => {
    if (allMessages.length > 0 && !isFetchingNextPage) scrollToBottom();
  }, [allMessages.length, isFetchingNextPage]);

  // --- CLEAR UNREAD BADGE ON MOUNT ---
  useEffect(() => {
    if (isSocketConnected && socket && userId && partnerId) {
      socket.emit("mark_messages_read", { senderId: partnerId });
      syncUnreadCount();
    }
  }, [isSocketConnected, socket, userId, partnerId, syncUnreadCount]);

  // --- DATA TRANSFORMATION (Grouping by Date) ---
  const groupedMessages = useMemo(() => {
    const groups: { type: "date" | "message"; value: any; id: string }[] = [];
    allMessages.forEach((msg, index) => {
      const currentDate = new Date(msg.createdAt).toDateString();
      const prevDate =
        index > 0
          ? new Date(allMessages[index - 1].createdAt).toDateString()
          : null;

      if (currentDate !== prevDate) {
        groups.push({
          type: "date",
          value: msg.createdAt,
          id: `date-${msg.createdAt}`,
        });
      }
      groups.push({ type: "message", value: msg, id: msg.id });
    });
    return groups;
  }, [allMessages]);

  const formatDateHeader = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (date.toDateString() === today) return "Сегодня";
      if (date.toDateString() === yesterday) return "Вчера";
      return format(date, "d MMMM", { locale: ru });
    } catch {
      return "";
    }
  };

  // --- ACTION HANDLERS ---
  const injectOptimisticMessage = (msg: ChatMessage) => {
    const queryKeyVariants = [
      ["chatHistory", partnerId],
      ["chatHistory", userId, partnerId],
    ];

    queryKeyVariants.forEach((key) => {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData || !oldData.pages)
          return { pages: [[msg]], pageParams: [null] };

        const newPages = JSON.parse(JSON.stringify(oldData.pages));
        const firstPage = newPages[0];

        if (firstPage.messages !== undefined) {
          firstPage.messages.push(msg);
        } else {
          firstPage.push(msg);
        }
        return { ...oldData, pages: newPages };
      });
    });

    scrollToBottom();
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text || !isSocketConnected || !socket) return;

    const tempId = `temp-${Date.now()}`;
    injectOptimisticMessage({
      id: tempId,
      tempId,
      senderId: userId,
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text || "Фото",
            senderId: replyingTo.senderId,
          }
        : undefined,
    });

    socket.emit("send_message", {
      receiverId: partnerId,
      text,
      tempId,
      replyToId: replyingTo?.id,
    });

    inputRef.current!.value = "";
    setReplyingTo(null);
    socket.emit("stop_typing", { receiverId: partnerId });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isSocketConnected || !socket) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      setIsUploading(true);
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1080,
      });
      const tempId = `img-temp-${Date.now()}`;

      injectOptimisticMessage({
        id: tempId,
        tempId,
        senderId: userId,
        imageUrl: URL.createObjectURL(compressedFile),
        createdAt: new Date().toISOString(),
        isRead: false,
        isOptimistic: true,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              text: replyingTo.text || "Фото",
              senderId: replyingTo.senderId,
            }
          : undefined,
      });

      const formData = new FormData();
      formData.append("attachment", compressedFile);

      const data = await apiRequest<{ url: string }>({
        method: "POST",
        url: "/notifications/chat/upload",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      socket.emit("send_message", {
        receiverId: partnerId,
        imageUrl: data.url,
        tempId,
        replyToId: replyingTo?.id,
      });

      setReplyingTo(null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!isSocketConnected || !socket) return;

    socket.emit("delete_message", { messageId, partnerId });
  };

  return (
    <motion.div
      initial={{ x: "20%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "20%", opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col h-full  relative overflow-hidden"
    >
      {/* 1. HEADER */}
      <ChatHeader
        partnerName={partnerName}
        partnerId={partnerId}
        isOnline={onlineUsers[partnerId] === true} // 🚨 FIX: Correct Record Mapping
        lastSeen={lastSeenMap[partnerId]}
        typingUser={typingUser}
        onBack={onBack}
      />

      {/* 2. CONNECTION STATUS BAR */}
      <ConnectionStatusBar />

      {/* 3. CHAT HISTORY (MAIN AREA) */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10"
      >
        <div ref={topSentinel} className="h-4 flex justify-center">
          {isFetchingNextPage && (
            <Loader2 className="animate-spin text-primary" />
          )}
        </div>

        {groupedMessages.map((item) => {
          if (item.type === "date") {
            return (
              <div key={item.id} className="flex justify-center my-4">
                <span className="bg-muted/80 text-muted-foreground text-[11px] px-3 py-1 rounded-lg font-bold shadow-sm">
                  {formatDateHeader(item.value)}
                </span>
              </div>
            );
          }

          const msg = item.value as ChatMessage;
          return (
            <ChatBubble
              key={item.id}
              msg={msg}
              isMine={msg.senderId === userId}
              onSwipe={(swipedMsg) => {
                if ("vibrate" in navigator) navigator.vibrate(30);
                setReplyingTo(swipedMsg);
              }}
              onLongPress={(pos, longPressedMsg) => {
                setMenuPosition(pos);
                setSelectedMessage(longPressedMsg);
              }}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-1" />
      </main>

      {/* 4. CONTEXT MENU (Floating, rendered when long-pressed) */}
      {selectedMessage && menuPosition && (
        <ChatContextMenu
          position={menuPosition}
          message={selectedMessage}
          isMine={selectedMessage.senderId === userId}
          onClose={() => {
            setSelectedMessage(null);
            setMenuPosition(null);
          }}
          onReply={() => setReplyingTo(selectedMessage)}
          onDelete={() => handleDeleteMessage(selectedMessage.id)}
        />
      )}

      {/* 5. FOOTER & INPUT AREA */}
      <footer className="p-3 bg-white  border-t shrink-0 flex flex-col pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="mb-2 p-2 bg-muted/30 rounded-lg border-l-4 border-primary flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-2 pl-2">
              <span className="text-xs font-bold text-primary block">
                {replyingTo.senderId === userId ? "Вы" : partnerName}
              </span>
              <span className="text-xs text-muted-foreground truncate block font-medium">
                {replyingTo.text || "Фотография"}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1.5 bg-muted/80 hover:bg-muted rounded-full transition-colors text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Controls */}
        <form
          onSubmit={handleSendText}
          className="flex gap-2 items-center relative"
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !isSocketConnected} // 🚨 UI GUARD
            className="p-2.5 text-muted-foreground hover:bg-muted/50 rounded-full transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <Paperclip className="w-6 h-6" />
            )}
          </button>

          <input
            ref={inputRef}
            disabled={!isSocketConnected} // 🚨 UI GUARD
            className="flex-1 bg-muted/40 rounded-full px-5 py-3 text-[15px] outline-none focus:ring-2 focus:ring-primary/50 transition-shadow border border-transparent disabled:opacity-60 disabled:bg-muted/80"
            placeholder={isSocketConnected ? "Сообщение..." : "Подключение..."}
            onChange={() =>
              socket?.emit("typing", {
                receiverId: partnerId,
              })
            }
          />

          <button
            type="submit"
            disabled={isUploading || !isSocketConnected} // 🚨 UI GUARD
            className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </footer>
    </motion.div>
  );
}
