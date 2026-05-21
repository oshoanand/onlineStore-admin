"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Loader2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { useAdminOrders } from "@/services/order";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-800",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrdersListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Simple debounce for search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput);
    setPage(1);
  };

  const { data, isLoading, isFetching } = useAdminOrders(
    page,
    10,
    statusFilter,
    debouncedSearch,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Управление заказами
          </h1>
          <p className="text-muted-foreground mt-1">
            Отслеживание и обработка заказов клиентов.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по ID заказа или клиента..."
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Найти
            </Button>
          </form>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все статусы</SelectItem>
              <SelectItem value="PENDING">Ожидает (PENDING)</SelectItem>
              <SelectItem value="CONFIRMED">Подтвержден</SelectItem>
              <SelectItem value="PROCESSING">В обработке</SelectItem>
              <SelectItem value="SHIPPED">Отправлен</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Передан курьеру</SelectItem>
              <SelectItem value="DELIVERED">Доставлен</SelectItem>
              <SelectItem value="CANCELLED">Отменен</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0 relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="px-6 py-4">ID Заказа & Дата</th>
                  <th className="px-6 py-4">Оплата</th>
                  <th className="px-6 py-4">Сумма</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      Заказы не найдены.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-blue-600 truncate max-w-[200px]">
                          {order.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(order.createdAt),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{order.paymentMode}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.paymentType === "POSTPAID"
                            ? "При получении"
                            : "Оплачено"}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {order.totalAmount} ₽
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`hover:opacity-80 ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-800"}`}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> Просмотр
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50 dark:bg-slate-900">
              <span className="text-sm text-muted-foreground">
                Страница {data.pagination.page} из {data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Вперед
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
