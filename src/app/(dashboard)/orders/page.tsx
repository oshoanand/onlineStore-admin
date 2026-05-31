"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Search,
  Loader2,
  Eye,
  PackageSearch,
  Clock,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { useAdminOrders } from "@/services/order";

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

// Generates an array of page numbers with ellipses for large page counts
const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export default function OrdersListPage() {
  const router = useRouter();

  // --- States ---
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  // Sorting States
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Date Range States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Update this hook call to accept the new sorting and date parameters in your service
  const { data, isLoading, isFetching } = useAdminOrders(
    page,
    10,
    statusFilter,
    submittedSearch,
    // @ts-ignore - Assuming useAdminOrders will be updated to accept these
    sortBy,
    sortOrder,
    startDate,
    endDate,
  );

  // --- Handlers ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSubmittedSearch("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc"); // default to desc for new column
    }
    setPage(1);
  };

  const meta = data?.pagination;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Заказы
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Управление, фильтрация и отслеживание заказов клиентов
          </p>
        </div>
      </div>

      {/* Filters & Search Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#005BFF] transition-colors" />
                <Input
                  placeholder="Поиск по ID заказа..."
                  className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 focus-visible:ring-[#005BFF]"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="bg-[#005BFF] hover:bg-blue-700 text-white font-bold transition-all active:scale-95 px-6"
              >
                Найти
              </Button>
            </form>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[220px] bg-slate-50 dark:bg-slate-900 border-slate-200 font-semibold">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold">
                  Все статусы
                </SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="font-medium">
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range & Clear Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0">
                <CalendarDays size={16} /> Дата от:
              </div>
              <Input
                type="date"
                value={startDate}
                max={endDate || undefined} // 🚨 Prevents selecting a start date after the end date
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900 h-9 font-medium"
              />
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0">
                до:
              </div>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined} // 🚨 Prevents selecting an end date before the start date
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900 h-9 font-medium"
              />
            </div>

            {(submittedSearch ||
              statusFilter !== "ALL" ||
              startDate ||
              endDate) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold w-full sm:w-auto shrink-0 transition-colors"
              >
                Сбросить фильтры
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto relative min-h-[400px]">
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#005BFF]" />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Обновление...
                </span>
              </div>
            </div>
          )}

          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
              <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                <TableHead
                  className="w-[180px] font-black text-slate-500 uppercase text-[11px] tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center">
                    ID Заказа
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-black text-slate-500 uppercase text-[11px] tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Дата создания
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </div>
                </TableHead>

                <TableHead className="font-black text-slate-500 uppercase text-[11px] tracking-wider">
                  Оплата
                </TableHead>
                <TableHead
                  className="font-black text-slate-500 uppercase text-[11px] tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("totalAmount")}
                >
                  <div className="flex items-center">
                    Сумма
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[11px] tracking-wider">
                  Статус
                </TableHead>
                <TableHead className="text-right font-black text-slate-500 uppercase text-[11px] tracking-wider">
                  Действия
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                // Skeleton Loading State
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-8 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <PackageSearch size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                        Ничего не найдено
                      </p>
                      <p className="text-sm mt-1">
                        Попробуйте изменить параметры поиска или фильтры.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((order: any) => {
                  const statusInfo =
                    STATUS_CONFIG[order.status] || STATUS_CONFIG["PENDING"];

                  return (
                    <TableRow
                      key={order.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group border-b-slate-100 dark:border-b-slate-800"
                    >
                      <TableCell className="font-bold text-slate-900 dark:text-white tracking-tight">
                        {order.orderId || order.id.split("-")[0]}
                      </TableCell>

                      <TableCell className="text-sm text-slate-600 font-medium">
                        {format(
                          new Date(order.createdAt),
                          "d MMMM yyyy, HH:mm",
                          { locale: ru },
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                            {order.paymentMethod || order.paymentMode}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {order.paymentType === "POSTPAID"
                              ? "При получении"
                              : "Предоплата"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-green-700 dark:text-white text-[15px]">
                        {Number(order.totalAmount).toLocaleString("ru-RU")} ₽
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center w-fit border ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="text-[#005BFF] hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" strokeWidth={2.5} />{" "}
                          Открыть
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dynamic Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 mt-auto gap-4">
            <p className="text-xs font-semibold text-slate-500">
              Показано{" "}
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {data?.data.length}
              </span>{" "}
              из{" "}
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {meta.total}
              </span>{" "}
              заказов
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1 || isFetching}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {generatePagination(page, meta.totalPages).map((p, idx) =>
                p === "..." ? (
                  <span
                    key={idx}
                    className="px-2 text-slate-400 font-bold tracking-widest"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={idx}
                    variant={page === p ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 font-bold ${page === p ? "bg-[#005BFF] text-white" : "text-slate-600"}`}
                    disabled={isFetching}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                ),
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === meta.totalPages || isFetching}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
