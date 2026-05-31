"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  ShieldAlert,
  Users,
  Eye,
  MessageSquare,
  ShoppingCart,
  Smartphone,
  Mail,
  Loader2,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatMobile } from "@/utils/helper";

import {
  useAdminCustomersQuery,
  useUpdateCustomerStatusMutation,
  Customer,
} from "@/services/customer";

import { useChatStore } from "@/store/useChatStore";
import { apiRequest } from "@/services/http/api-client";

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: response, isLoading, isError } = useAdminCustomersQuery();
  const statusMutation = useUpdateCustomerStatusMutation();

  const customers = response?.data || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // 🚨 Dialog State
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [pendingStatus, setPendingStatus] = useState<string>("ACTIVE");

  const onlineUsers = useChatStore((state) => state.onlineUsers);
  // 🚨 REMOVED connectSocket: SocketProvider handles this globally now!

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer: Customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.mobile.includes(searchQuery.replace(/\D/g, "")) ||
        (customer.email &&
          customer.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  // 🚨 Opens the Dialog
  const handleOpenStatusDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPendingStatus(customer.status);
    setIsStatusDialogOpen(true);
  };

  // 🚨 Submits the Dialog Form
  const handleConfirmStatusChange = async () => {
    if (!selectedCustomer) return;

    try {
      await statusMutation.mutateAsync({
        id: selectedCustomer.id,
        status: pendingStatus,
      });
      toast({
        title: "Статус обновлен",
        description: `Статус клиента ${selectedCustomer.name} успешно изменен.`,
        variant: "success",
      });
      setIsStatusDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          error.response?.data?.message || "Не удалось обновить статус",
      });
    }
  };

  const handleStartChat = async (partnerId: string) => {
    try {
      const res = await apiRequest<{ partnerId: string }>({
        method: "POST",
        url: "/notifications/chat/init",
        data: { partnerId: partnerId },
      });
      if (res?.partnerId) router.push(`/chat/${res.partnerId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось открыть чат.",
      });
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-red-500 gap-4 p-2">
        <ShieldAlert className="h-16 w-16" />
        <div className="text-center">
          <h2 className="text-xl font-bold">Ошибка доступа</h2>
          <p className="text-muted-foreground">
            Не удалось загрузить список клиентов.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-2">
        <div>
          <h1 className="text-md font-semibold tracking-tight uppercase text-slate-900 dark:text-white">
            Клиенты
          </h1>
          <p className="text-muted-foreground font-medium mt-1 tsx-sm">
            Отслеживание покупателей, истории заказов и статусов.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 ">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#005BFF] transition-colors" />
            <Input
              placeholder="Поиск по имени, телефону, email..."
              className="pl-9 bg-background focus-visible:ring-[#005BFF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] font-semibold">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Статус" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">
                Все статусы
              </SelectItem>
              <SelectItem value="ACTIVE" className="font-medium text-green-600">
                Активные
              </SelectItem>
              <SelectItem
                value="INACTIVE"
                className="font-medium text-slate-500"
              >
                Неактивные
              </SelectItem>
              <SelectItem value="BLOCKED" className="font-medium text-red-600">
                Заблокированные
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-semibold text-slate-500 whitespace-nowrap">
          Найдено:{" "}
          <span className="font-black text-slate-900 dark:text-white text-lg">
            {filteredCustomers.length}
          </span>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800  overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="w-[300px] font-black text-slate-500 uppercase text-[11px] tracking-wider">
                    Клиент
                  </TableHead>
                  <TableHead className="font-black text-slate-500 uppercase text-[11px] tracking-wider">
                    Регистрация
                  </TableHead>
                  <TableHead className="font-black text-slate-500 uppercase text-[11px] tracking-wider">
                    Заказы
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
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                        <Users className="h-12 w-12 opacity-50" />
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          Клиенты не найдены
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer: Customer) => {
                    // 🚨 FIX: Correct usage of Record mapping for high performance checks
                    const isOnlineRealtime = onlineUsers[customer.id] === true;

                    return (
                      <TableRow
                        key={customer.id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b-slate-100 dark:border-b-slate-800"
                      >
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="h-12 w-12 ">
                                <AvatarImage
                                  src={
                                    customer.profilePhoto ||
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`
                                  }
                                />
                                <AvatarFallback className="font-bold bg-blue-50 text-blue-700">
                                  {customer.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>

                              <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 transition-colors duration-300 ${
                                  isOnlineRealtime
                                    ? "bg-green-500"
                                    : "bg-slate-300 dark:bg-slate-600"
                                }`}
                                title={isOnlineRealtime ? "Онлайн" : "Оффлайн"}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white text-[15px]">
                                {customer.name}
                              </span>

                              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-0.5">
                                <Smartphone size={12} />{" "}
                                {formatMobile(customer.mobile)}
                              </span>
                              {customer.email && (
                                <span className="flex items-center gap-1 truncate text-[11px] font-medium text-slate-500">
                                  <Mail size={12} /> {customer.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {format(new Date(customer.createdAt), "d MMM yyyy", {
                            locale: ru,
                          })}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit px-2 py-1 rounded-md text-xs font-bold">
                            <ShoppingCart size={14} />
                            {customer.totalOrders}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                              customer.status === "ACTIVE"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : customer.status === "BLOCKED"
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                customer.status === "ACTIVE"
                                  ? "bg-green-600"
                                  : customer.status === "BLOCKED"
                                    ? "bg-red-500"
                                    : "bg-red-500"
                              }`}
                            />
                            {customer.status === "ACTIVE"
                              ? "Активен"
                              : customer.status === "BLOCKED"
                                ? "Заблокирован"
                                : "Неактивен"}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 font-medium"
                            >
                              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-400">
                                Действия
                              </DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/customers/${customer.id}`)
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4 text-blue-500" />{" "}
                                Профиль клиента
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleStartChat(customer.id)}
                                className="cursor-pointer"
                              >
                                <MessageSquare className="mr-2 h-4 w-4 text-emerald-500" />{" "}
                                Написать в чат
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleOpenStatusDialog(customer)}
                                className="cursor-pointer"
                              >
                                <Settings2 className="mr-2 h-4 w-4 text-slate-500" />{" "}
                                Изменить статус
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 🚨 Status Update Dialog Modal */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Изменение статуса</DialogTitle>
            <DialogDescription>
              Выберите новый статус для клиента{" "}
              <strong className="text-foreground">
                {selectedCustomer?.name}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={pendingStatus} onValueChange={setPendingStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="ACTIVE"
                  className="text-green-600 font-medium"
                >
                  Активен
                </SelectItem>
                <SelectItem
                  value="INACTIVE"
                  className="text-red-600 font-medium"
                >
                  Неактивен
                </SelectItem>
                <SelectItem
                  value="BLOCKED"
                  className="text-red-600 font-medium"
                >
                  Заблокирован
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={statusMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              // 👇 FIX: Use optional chaining instead of the && operator
              disabled={
                statusMutation.isPending ||
                selectedCustomer?.status === pendingStatus
              }
            >
              {statusMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
