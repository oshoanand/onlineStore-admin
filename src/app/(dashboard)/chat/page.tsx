"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import ChatListScreen from "@/components/chat/ChatListScreen";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Zustand Store
  // 🚨 FIX: Removed connectSocket! The SocketProvider handles this globally now.
  const setActiveChat = useChatStore((state) => state.setActiveChat);

  // Safely extract user ID
  const userId = session?.user?.id;

  useEffect(() => {
    // Wait until NextAuth has finished checking the session
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (userId) {
      // 1. Ensure NO chat is currently marked as active
      // This is crucial so that if a message arrives while looking at the list,
      // the unread badge increments and the notification sound plays.
      setActiveChat(null);

      // 2. Mark page as ready to render the child component
      setIsReady(true);
    }
  }, [status, userId, router, setActiveChat]);

  // Handle navigation from the list to the specific chat room
  const handleNavigateToChat = (partnerId: string) => {
    router.push(`/chat/${partnerId}`);
  };

  if (!isReady || status === "loading") {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
        <p className="text-muted-foreground font-medium">Загрузка чатов...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background md:pb-0 overflow-hidden">
      <ChatListScreen onNavigateToDetail={handleNavigateToChat} />
    </div>
  );
}
