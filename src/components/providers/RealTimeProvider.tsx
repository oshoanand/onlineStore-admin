"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

export default function RealTimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { toast } = useToast();

  const {
    setSocket,
    incrementUnread,
    incrementUnreadChat,
    setOnlineUser,
    setTypingStatus,
  } = useAppStore();

  // ---------------------------------------------------------------------------
  // CRITICAL OPTIMIZATION: Refs for volatile state
  // We use Refs for `pathname` and Zustand actions so we can access their latest
  // values inside the socket listeners WITHOUT putting them in the useEffect
  // dependency array. If we put `pathname` in the dependency array, the socket
  // would disconnect and reconnect every single time the user clicks a link!
  // ---------------------------------------------------------------------------
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const actionsRef = useRef({
    incrementUnread,
    incrementUnreadChat,
    setOnlineUser,
    setTypingStatus,
  });
  useEffect(() => {
    actionsRef.current = {
      incrementUnread,
      incrementUnreadChat,
      setOnlineUser,
      setTypingStatus,
    };
  }, [incrementUnread, incrementUnreadChat, setOnlineUser, setTypingStatus]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;

    // 1. Initialize Socket.io
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL!, {
      path: "/notifications/socket.io",
      auth: { token: session.accessToken },
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () =>
      console.log("✅ Real-time WS connected"),
    );

    // 2. Handle In-App Notifications (Bell Icon)
    socketInstance.on("new_notification", (notification) => {
      actionsRef.current.incrementUnread();

      // Instantly update React Query cache without fetching
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            notifications: [notification, ...old.data.notifications],
            unreadCount: old.data.unreadCount + 1,
          },
        };
      });

      toast({ title: notification.title, description: notification.message });
    });

    // 3. Handle Chat Messages
    socketInstance.on("receive_message", (message) => {
      // Add message to chat history cache
      queryClient.setQueryData(["chat-history", message.roomId], (old: any) => {
        if (!old) return old;
        return { ...old, data: [...old.data, message] };
      });

      // Update Chat Room List (Sidebar)
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });

      // Check if user is currently looking at the chat page
      if (!pathnameRef.current.startsWith("/chat")) {
        // Increment the blue chat badge in the Header
        actionsRef.current.incrementUnreadChat();

        // Show a quick toast previewing the message
        toast({
          variant: "success",
          title: "New Message",
          description: message.content
            ? message.content.substring(0, 40) +
              (message.content.length > 40 ? "..." : "")
            : "Sent an attachment 📎",
        });
      }
    });

    // 4. Presence & Typing
    socketInstance.on("user_status_change", ({ userId, isOnline }) => {
      actionsRef.current.setOnlineUser(userId, isOnline);
    });

    socketInstance.on("user_typing", ({ roomId, isTyping }) => {
      actionsRef.current.setTypingStatus(roomId, isTyping);
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };

    // Notice how pathname and zustand actions are intentionally NOT in this array.
  }, [status, session, queryClient, setSocket, toast]);

  return <>{children}</>;
}
