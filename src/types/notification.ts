export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, any>; // Stores extra metadata like orderId, productId, url, etc.
}
