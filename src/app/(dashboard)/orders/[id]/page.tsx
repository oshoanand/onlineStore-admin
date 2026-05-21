"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  ShieldCheck,
  Clock,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { useOrderDetails, useUpdateOrderStatus } from "@/services/order";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.id as string;

  const { data: order, isLoading } = useOrderDetails(orderId);
  const updateStatusMutation = useUpdateOrderStatus();

  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) return <div>Заказ не найден</div>;

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
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Заказ {order.id.split("-")[0]}...
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm")}
            </p>
          </div>
        </div>
        <Badge className="text-sm px-4 py-1">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* ACTION PANEL: Change Status */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Управление статусом</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Выберите новый статус..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESSING">
                      В обработке (PROCESSING)
                    </SelectItem>
                    <SelectItem value="SHIPPED">Отправлен (SHIPPED)</SelectItem>
                    <SelectItem value="OUT_FOR_DELIVERY">
                      Передан курьеру (OUT_FOR_DELIVERY)
                    </SelectItem>
                    <SelectItem value="DELIVERED">
                      Доставлен (DELIVERED)
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      Отменить заказ (CANCELLED)
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || updateStatusMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateStatusMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Применить статус
                </Button>
              </div>
              <Textarea
                placeholder="Заметка для истории заказа (необязательно, видна только администраторам)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="bg-white dark:bg-slate-950 resize-none h-16"
              />
            </CardContent>
          </Card>

          {/* ORDER ITEMS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Товары
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {item.productId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.priceAtTime} ₽</p>
                      <p className="text-sm text-muted-foreground">
                        Кол-во: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DELIVERY PIN CARD (Crucial for Admin visibility if courier loses it) */}
          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-400">
                  PIN-код для получения заказа
                </p>
                <p className="text-2xl font-mono tracking-widest font-bold">
                  {order.deliveryAuthCode}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Клиент должен сообщить этот код курьеру при вручении.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Meta & History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <CreditCard className="h-4 w-4" /> Оплата
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Метод:</span>{" "}
                  <span className="font-medium">{order.paymentMode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Тип:</span>{" "}
                  <span className="font-medium">{order.paymentType}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Доставка:</span>{" "}
                  <span className="font-medium">{order.shippingCost} ₽</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Итого:</span> <span>{order.totalAmount} ₽</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <MapPin className="h-4 w-4" /> Адрес доставки
                </div>
                <p className="text-sm">{order.shippingAddress.street}</p>
                <p className="text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.zip}
                </p>
                <p className="text-sm font-medium mt-2">
                  📞 {order.shippingAddress.phone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AUDIT TRAIL TIMELINE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" /> История (Аудит)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                {order.history?.map((log, index) => (
                  <div key={log.id} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-950" />

                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold">{log.action}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {format(new Date(log.createdAt), "dd.MM HH:mm")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-50"
                        >
                          {log.userRole}
                        </Badge>
                        <span
                          className="text-muted-foreground truncate"
                          title={log.userId}
                        >
                          {log.userId.split("-")[0]}
                        </span>
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded mt-2 border">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
