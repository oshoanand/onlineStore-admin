export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMode = "CARD" | "CASH" | "UPI" | "WALLET" | "NET_BANKING";
export type PaymentType = "PREPAID" | "POSTPAID";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtTime: string | number;
  imageUrl?: string;
  product?: {
    thumbImage?: string;
  };
}

export interface OrderHistory {
  id: string;
  action: string;
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  userId: string;
  userRole: string;
  notes: string | null;
  createdAt: string;
}

// 🚨 NEW: Customer Interface for Admin Panel
export interface OrderCustomer {
  id: string;
  email: string;
  mobile: string;
  fullName: string;
  profilePhoto: string | null;
}

export interface Order {
  id: string;
  orderId?: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMode;
  paymentType: PaymentType;
  deliveryAuthCode: string;
  totalAmount: string | number;
  shippingCost: string | number;
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
    phone: string;
  };
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  history?: OrderHistory[];
  customer?: OrderCustomer; // 🚨 Added to Order type
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
