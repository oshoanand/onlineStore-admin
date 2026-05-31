"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { formatMobile } from "@/utils/helper";
import {
  ChevronLeft,
  Package,
  CreditCard,
  MapPin,
  ShieldCheck,
  Clock,
  Loader2,
  FileText,
  PackageSearch,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  User,
  PhoneCall,
  Mail,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { useOrderDetails, useUpdateOrderStatus } from "@/services/order";

// Shared Status Configuration for consistent UI
const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  PENDING: {
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <Clock size={14} className="mr-1.5" />,
    label: "Ожидает",
  },
  AWAITING_PAYMENT: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <AlertCircle size={14} className="mr-1.5" />,
    label: "Ожидает оплату",
  },
  CONFIRMED: {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <CreditCard size={14} className="mr-1.5" />,
    label: "Подтвержден",
  },
  PROCESSING: {
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: <PackageSearch size={14} className="mr-1.5" />,
    label: "В обработке",
  },
  SHIPPED: {
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <Truck size={14} className="mr-1.5" />,
    label: "Отправлен",
  },
  OUT_FOR_DELIVERY: {
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <Truck size={14} className="mr-1.5" />,
    label: "В пути",
  },
  DELIVERED: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 size={14} className="mr-1.5" />,
    label: "Доставлен",
  },
  CANCELLED: {
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle size={14} className="mr-1.5" />,
    label: "Отменен",
  },
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params?.id;

  const { data: order, isLoading } = useOrderDetails(orderId as string);
  const updateStatusMutation = useUpdateOrderStatus();

  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#005BFF]" />
        <p className="text-slate-500 font-medium animate-pulse">
          Загрузка данных заказа...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-slate-500">
        <FileText className="h-12 w-12 opacity-20" />
        <h2 className="text-xl font-bold text-slate-700">Заказ не найден</h2>
        <Button variant="outline" onClick={() => router.push("/orders")}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const currentStatusInfo =
    STATUS_CONFIG[order.status] || STATUS_CONFIG["PENDING"];
  const customer = order.customer; // Extracted from the new backend response

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    updateStatusMutation.mutate(
      { id: order.id, status: newStatus, notes: adminNotes },
      {
        onSuccess: () => {
          toast({
            title: "Успешно",
            description: "Статус заказа обновлен",
            variant: "success",
          });
          setNewStatus("");
          setAdminNotes("");
        },
        onError: (err: any) => {
          toast({
            title: "Ошибка",
            description: err.response?.data?.message || err.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 p-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Заказ #{order.orderId || order.id.split("-")[0]}
              </h1>
              <Badge
                variant="outline"
                className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center w-fit border ${currentStatusInfo.color}`}
              >
                {currentStatusInfo.icon}
                {currentStatusInfo.label}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock size={14} />
              {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", {
                locale: ru,
              })}
            </p>
          </div>
        </div>

        {/* ORDER HISTORY BUTTON (OPENS MODAL) */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className="font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <History className="mr-2 h-4 w-4" />
              История заказа
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <History className="h-5 w-5 text-[#005BFF]" /> Аудит лог
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto pr-4 custom-scrollbar flex-1 pb-4">
              <div className="space-y-6 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-2 mt-4">
                {order.history?.map((log: any) => (
                  <div key={log.id} className="relative">
                    <div
                      className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-950 ${log.userRole === "ADMINISTRATOR" ? "bg-purple-500" : log.userRole === "SYSTEM" ? "bg-slate-400" : "bg-[#005BFF]"}`}
                    />
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {log.action}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                          {format(new Date(log.createdAt), "dd.MM HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase tracking-widest font-black ${log.userRole === "ADMINISTRATOR" ? "text-purple-600 bg-purple-50 border-purple-200" : "text-slate-500 bg-slate-50"}`}
                        >
                          {log.userRole}
                        </Badge>
                        <span
                          className="text-slate-400 font-mono text-[10px]"
                          title={log.userId}
                        >
                          ID: {log.userId.split("-")[0]}
                        </span>
                      </div>
                      {log.notes && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mt-2 border border-slate-100 dark:border-slate-800">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Data & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* CUSTOMER INFORMATION CARD */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-slate-500" /> Данные клиента
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {customer ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="flex items-center gap-4">
                    {/* Profile Photo */}
                    <div className="w-16 h-16 rounded-full border-2 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                      {customer.profilePhoto ? (
                        <img
                          src={customer.profilePhoto}
                          alt={customer.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-slate-300" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="space-y-1">
                      <h3 className="font-black text-lg text-slate-900 dark:text-white leading-none">
                        {customer.fullName}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm font-medium text-slate-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Mail size={14} className="text-slate-400" />{" "}
                          {customer.email}
                        </span>
                        <span className="hidden sm:inline text-slate-300">
                          •
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Smartphone size={14} className="text-slate-400" />{" "}
                          {formatMobile(customer.mobile)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Call Action Button */}
                  {customer.mobile && (
                    <a
                      href={`tel: +7${customer.mobile}`}
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-500/20 active:scale-95 transition-all flex items-center gap-2">
                        <PhoneCall size={18} />
                        Позвонить
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-400">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">
                    Информация о клиенте недоступна (Гость или аккаунт удален).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ACTION PANEL: Change Status */}
          <Card className="border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-blue-100 dark:border-blue-900/30 bg-blue-50/80 dark:bg-blue-900/20">
              <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2">
                <PackageSearch className="h-5 w-5" /> Управление статусом
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-white dark:bg-slate-950 font-semibold border-slate-200">
                    <SelectValue placeholder="Выберите новый статус..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESSING" className="font-medium">
                      В обработке (PROCESSING)
                    </SelectItem>
                    <SelectItem value="SHIPPED" className="font-medium">
                      Отправлен (SHIPPED)
                    </SelectItem>
                    <SelectItem
                      value="OUT_FOR_DELIVERY"
                      className="font-medium"
                    >
                      Передан курьеру (OUT_FOR_DELIVERY)
                    </SelectItem>
                    <SelectItem value="DELIVERED" className="font-medium">
                      Доставлен (DELIVERED)
                    </SelectItem>
                    <SelectItem
                      value="CANCELLED"
                      className="font-medium text-red-600"
                    >
                      Отменить заказ (CANCELLED)
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleUpdateStatus}
                  disabled={
                    !newStatus ||
                    updateStatusMutation.isPending ||
                    newStatus === order.status
                  }
                  className="bg-[#005BFF] hover:bg-blue-700 text-white font-bold transition-all active:scale-95"
                >
                  {updateStatusMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Применить статус
                </Button>
              </div>
              <Textarea
                placeholder="Заметка для истории (необязательно, видна только администраторам)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="bg-white dark:bg-slate-950 resize-none h-20 border-slate-200"
              />
            </CardContent>
          </Card>

          {/* ORDER ITEMS WITH IMAGES */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-slate-500" /> Состав заказа
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.product?.thumbImage || item.imageUrl ? (
                          <img
                            src={item.product?.thumbImage || item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight mb-1 truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">
                          ID: {item.productId.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 sm:min-w-[200px] border-t sm:border-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                      <div className="text-sm font-medium text-slate-500">
                        {item.quantity} шт. ×{" "}
                        {Number(item.priceAtTime).toLocaleString("ru-RU")} ₽
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-900 dark:text-white">
                          {(
                            Number(item.priceAtTime) * item.quantity
                          ).toLocaleString("ru-RU")}{" "}
                          ₽
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DELIVERY PIN CARD */}
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 shadow-sm">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="p-4 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-2xl shrink-0">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1">
                  PIN-код для вручения
                </p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-mono tracking-[0.2em] font-black text-slate-900 dark:text-white">
                    {order.deliveryAuthCode}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1.5">
                    Сообщить курьеру
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Meta & Details */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg">
                Детали оплаты и доставки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <CreditCard className="h-4 w-4" /> Оплата
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-500">Метод:</span>
                  <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-500">Тип:</span>
                  <span className="text-slate-900 dark:text-white">
                    {order.paymentType === "POSTPAID"
                      ? "При получении"
                      : "Предоплата"}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-slate-100 dark:border-slate-800 font-medium">
                  <span className="text-slate-500">Доставка:</span>
                  <span className="text-[#00B15C] font-bold">
                    {Number(order.shippingCost) === 0
                      ? "Бесплатно"
                      : `${Number(order.shippingCost).toLocaleString("ru-RU")} ₽`}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-black pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-900 dark:text-white">Итого:</span>
                  <span className="text-[#005BFF]">
                    {Number(order.totalAmount).toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <MapPin className="h-4 w-4" /> Адрес доставки
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {order.shippingAddress.street}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {order.shippingAddress.city}, {order.shippingAddress.zip}
                  </p>
                  {/* <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      📞 {order.shippingAddress.phone}
                    </p>
                  </div> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
