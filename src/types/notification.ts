export interface BaseNotification {
  id: string | number;
  isRead?: boolean;
  title: string;
  message?: string;
  createdAt: string | Date;
}

// Chat Message Notification (NEW)
export interface ChatMessagePayload extends BaseNotification {
  type: "CHAT_MESSAGE";
  data: {
    chatId: string;
    senderName: string;
    preview: string;
  };
}

// 🚨 FIX: Added "extends BaseNotification" here
export interface SystemRequestPayload extends BaseNotification {
  type: "SYSTEM";
  link?: string;
  createdAt: string;
}

// Union Type
export type NotificationItem =
  | ChatMessagePayload
  | SystemRequestPayload
  | (BaseNotification & { type: string; data?: any });

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  socket: any;
}
