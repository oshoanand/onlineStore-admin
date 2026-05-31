"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/components/providers/SocketProvider";
import { useQueryClient } from "@tanstack/react-query";
import {
  NotificationContextType,
  NotificationItem,
} from "@/types/notification";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // --- Audio Helper ---
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.wav");
      audio.play().catch((e) => console.log("Audio play blocked", e));
    } catch (error) {
      console.error("Audio error:", error);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: any) => {
      console.log("🔔 Received Admin Notification:", payload);

      const { type, data } = payload;

      // 🚨 ANTI-SPAM CHECK: Determine if this is a live event or old history
      const notifTime = payload.createdAt
        ? new Date(payload.createdAt).getTime()
        : Date.now();
      const isOldMessage = Date.now() - notifTime > 10000; // Older than 10 seconds

      // Create a safe base item for TypeScript compliance
      const baseItem = {
        id: payload.id || Date.now().toString(),
        isRead: false,
        createdAt: payload.createdAt || new Date().toISOString(),
      };

      // --- Handle "PARTNER_REQUEST", "SYSTEM", or "MODERATION_UPDATE" ---
      if (type === "SYSTEM") {
        const item: NotificationItem = {
          ...baseItem,
          type: type as any,
          title: payload.title || "Уведомление",
          message: payload.message || payload.body,
          link: payload.link || data?.url,
          data: data || {},
        } as any;

        setNotifications((prev) => [item, ...prev]);
        setUnreadCount((prev) => prev + 1);

        if (!isOldMessage) {
          playNotificationSound();
          toast({
            title:
              payload.title ||
              (type === "SYSTEM" ? "Системное уведомление" : "Уведомление"),
            description: payload.message || payload.body,
            duration: 8000,
            action:
              payload.link || data?.url
                ? {
                    label: "Смотреть",
                    onClick: () => router.push(payload.link || data?.url),
                  }
                : undefined,
          });
        }
      }

      // --- Handle Unknown generic types ---
      else {
        const item: NotificationItem = {
          ...baseItem,
          ...payload,
          type: type || "SYSTEM",
        } as any;

        setNotifications((prev) => [item, ...prev]);
        setUnreadCount((prev) => prev + 1);

        if (!isOldMessage) {
          toast({
            variant: "success",
            title: payload.title || "Уведомление",
            description:
              payload.message || payload.body || "Новое сообщение от системы",
          });
        }
      }
    };

    // Attach Listener
    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, toast, router, playNotificationSound, queryClient]);

  // --- Mark Read Logic ---
  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.isRead) {
          // Prevent negative count
          setUnreadCount((c) => Math.max(0, c - 1));
          return { ...n, isRead: true };
        }
        return n;
      }),
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        socket,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};
