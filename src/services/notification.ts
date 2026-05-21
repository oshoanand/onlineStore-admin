import { apiRequest } from "@/services/http/api-client";
import { NotificationItem } from "@/types/notification";

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

  // 🚨 ADD THIS NEW FUNCTION
  markAllAsRead: () =>
    apiRequest<{ success: boolean }>({
      method: "PATCH",
      url: `/notifications/read-all`,
    }),

  registerDeviceToken: (fcmToken: string) =>
    apiRequest<{ success: boolean }>({
      method: "POST",
      url: "/notifications/device-token",
      data: { token: fcmToken },
    }),
};
