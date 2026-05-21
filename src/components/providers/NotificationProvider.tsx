"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/services/notification";
import { NotificationItem } from "@/types/notification";
import { useAppStore } from "@/store/useAppStore";
import { useSession } from "next-auth/react";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const setUnreadNotifications = useAppStore(
    (state) => state.setUnreadNotifications,
  );

  // Fetch notifications only if the user is authenticated
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await notificationApi.getNotifications();
      return response.data;
    },
    enabled: status === "authenticated",
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Keep your Zustand store in sync with the fetched data
  useEffect(() => {
    setUnreadNotifications(unreadCount);
  }, [unreadCount, setUnreadNotifications]);

  // Mutation for marking a single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Optimistic Update: instantly make UI feel fast
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: NotificationItem) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
    },
  });

  // Mutation for marking ALL notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Optimistic Update: instantly clear the red badge on the bell
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: NotificationItem) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        };
      });
    },
  });

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};
