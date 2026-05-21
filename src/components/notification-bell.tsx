"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Package,
  Truck,
  CheckCircle2,
  Handshake,
  Info,
  UserPlus,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  XCircle,
  PackageCheck,
} from "lucide-react";
import { useNotification } from "@/components/providers/NotificationProvider";
import { NotificationItem } from "@/types/notification";

const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { unreadCount, notifications, markAllAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleBellClick = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    // If opening the dropdown and there are unread items, clear the badge
    if (nextState && unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to format date safely
  const formatTime = (dateInput: string | Date) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);

    // If it's today, show time. Otherwise, show date and time.
    const isToday = new Date().toDateString() === date.toDateString();
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      ...(isToday ? {} : { day: "2-digit", month: "2-digit" }),
    });
  };

  const handleNotificationClick = (link?: string) => {
    setIsOpen(false);
    if (link) {
      router.push(link);
    }
  };

  // --- Helper to get UI configuration based on Notification Type ---
  const getNotificationConfig = (notif: any) => {
    // Extract common data safely
    const orderId = notif.data?.orderId || "";
    const productId = notif.data?.productId || "";

    switch (notif.type) {
      // 1. User & Partner Events
      case "MODERATION_UPDATE":
      case "NEW_USER":
        return {
          icon: <UserPlus size={16} />,
          colorClass: "bg-purple-100 text-purple-600",
          title: notif.title || "Новый пользователь",
          link: notif.data?.url || notif.link || "/users",
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || "Пользователь ожидает модерации."}
            </p>
          ),
        };

      case "PARTNER_REQUEST":
        return {
          icon: <Handshake size={16} />,
          colorClass: "bg-emerald-100 text-emerald-600",
          title: "Новый партнер",
          link: notif.data?.url || notif.link || "/partners",
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message}
            </p>
          ),
        };

      // 2. Order Events
      case "ORDER_PLACED":
        return {
          icon: <ShoppingCart size={16} />,
          colorClass: "bg-blue-100 text-blue-600",
          title: notif.title || "Новый заказ",
          link:
            notif.data?.url ||
            notif.link ||
            (orderId ? `/orders/${orderId}` : "/orders"),
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || `Оформлен новый заказ.`}
            </p>
          ),
        };

      case "ORDER_SHIPPED":
        return {
          icon: <Truck size={16} />,
          colorClass: "bg-indigo-100 text-indigo-600",
          title: notif.title || "Заказ отправлен",
          link:
            notif.data?.url ||
            notif.link ||
            (orderId ? `/orders/${orderId}` : "/orders"),
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || "Заказ передан в доставку."}
            </p>
          ),
        };

      case "ORDER_DELIVERED":
        return {
          icon: <PackageCheck size={16} />,
          colorClass: "bg-green-100 text-green-600",
          title: notif.title || "Заказ доставлен",
          link:
            notif.data?.url ||
            notif.link ||
            (orderId ? `/orders/${orderId}` : "/orders"),
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || "Клиент успешно получил заказ."}
            </p>
          ),
        };

      case "ORDER_CANCELLED":
        return {
          icon: <XCircle size={16} />,
          colorClass: "bg-red-100 text-red-600",
          title: notif.title || "Заказ отменен",
          link:
            notif.data?.url ||
            notif.link ||
            (orderId ? `/orders/${orderId}` : "/orders"),
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || "Заказ был отменен."}
            </p>
          ),
        };

      case "PAYMENT_RECEIVED":
        return {
          icon: <CreditCard size={16} />,
          colorClass: "bg-teal-100 text-teal-600",
          title: notif.title || "Оплата получена",
          link:
            notif.data?.url ||
            notif.link ||
            (orderId ? `/orders/${orderId}` : "/orders"),
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || "Оплата по заказу успешно прошла."}
            </p>
          ),
        };

      // 3. Inventory & System Events
      case "OUT_OF_STOCK":
      case "LOW_STOCK":
        return {
          icon: <AlertTriangle size={16} />,
          colorClass: "bg-amber-100 text-amber-600",
          title: notif.title || "Заканчивается товар",
          link:
            notif.data?.url ||
            notif.link ||
            (productId ? `/products/edit/${productId}` : "/products"),
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || "Внимание: остатки товара на исходе."}
            </p>
          ),
        };

      case "SYSTEM":
      default:
        return {
          icon: <Info size={16} />,
          colorClass: "bg-slate-100 text-slate-600",
          title: notif.title || "Системное уведомление",
          link: notif.data?.url || notif.link || undefined,
          body: (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {notif.message || "У вас новое уведомление"}
            </p>
          ),
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* --- Bell Icon Button --- */}
      <button
        onClick={handleBellClick}
        aria-label="Уведомления"
        className="relative group flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
      >
        <Bell
          className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110"
          strokeWidth={2}
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-white shadow-sm ring-2 ring-background animate-in zoom-in duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* --- Dropdown Menu --- */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Уведомления</span>
            <span className="text-xs text-gray-500">
              {notifications.length} последних
            </span>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-gray-300" />
                <p>Уведомлений нет. Вы все прочитали!</p>
              </div>
            ) : (
              notifications.map((notif: NotificationItem, index: number) => {
                const config = getNotificationConfig(notif);

                return (
                  <div
                    key={notif.id || index}
                    onClick={() => handleNotificationClick(config.link)}
                    className="p-3 border-b border-gray-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      {/* --- DYNAMIC ICON --- */}
                      <div
                        className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${config.colorClass}`}
                      >
                        {config.icon}
                      </div>

                      {/* --- DYNAMIC CONTENT --- */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {config.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                            {formatTime((notif as any).createdAt || new Date())}
                          </span>
                        </div>
                        {config.body}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  markAllAsRead();
                  setIsOpen(false);
                }}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Отметить все как прочитанные
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
