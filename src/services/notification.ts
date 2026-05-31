import { apiRequest } from "@/services/http/api-client";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerRole?: string;
  partnerImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
}

export const notificationApi = {
  getNotifications: () =>
    apiRequest<{
      data: { unreadCount: number; notifications: NotificationItem[] };
    }>({
      method: "GET",
      url: "/notifications",
    }),

  markAsRead: (id: string) =>
    apiRequest<{ success: boolean }>({
      method: "PATCH",
      url: `/notifications/${id}/read`,
    }),

  markAllAsRead: () =>
    apiRequest<{ success: boolean }>({
      method: "PATCH",
      url: `/notifications/read-all`,
    }),

  getChatSessions: () =>
    apiRequest<ChatSession[]>({
      method: "GET",
      url: "/notifications/chat/sessions",
    }),

  registerDeviceToken: (fcmToken: string) =>
    apiRequest<{ success: boolean }>({
      method: "POST",
      url: "/notifications/device-token",
      data: { token: fcmToken },
    }),
};
