"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Loader2,
  X,
  MessageSquare,
  UserCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber, formatDate } from "@/utils/helper";
import { apiRequest } from "@/services/http/api-client"; // Helper for API calls

// Import your queries and mutations
import {
  useCustomersQuery,
  useUpdateModerationMutation,
  Customer,
} from "@/data/use-customers";

// 1. IMPORT SOCKET HOOK
import { useSocket } from "@/components/providers/socket-provider";

export default function CustomersTable() {
  const { toast } = useToast();
  const router = useRouter();

  // 2. GET ONLINE USERS FROM SOCKET
  const { onlineUsers } = useSocket() || { onlineUsers: [] };

  // Table State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Data Hooks
  const { data, isLoading, isError } = useCustomersQuery(page, limit);
  const { mutate: updateModeration, isPending: isUpdating } =
    useUpdateModerationMutation();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState<string>("");

  // --- Handlers ---

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.meta.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNewStatus(customer.moderation_status);
    setIsEditModalOpen(true);
  };

  // 3. HANDLE START CHAT
  const handleStartChat = async (customerId: string) => {
    try {
      // Create or get chat via API
      const res = await apiRequest<{ id: string }>({
        method: "post",
        url: "/api/chats/create",
        data: { targetUserId: customerId },
      });
      // Redirect to the chat room
      router.push(`/chat/${res.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось открыть чат с заказчиком",
      });
    }
  };

  const handleSaveStatus = () => {
    if (!selectedCustomer) return;

    updateModeration(
      { id: selectedCustomer.id, status: newStatus },
      {
        onSuccess: () => {
          toast({
            title: "Успех",
            description: "Статус модерации успешно обновлен.",
            className: "bg-green-600 text-white border-green-700",
          });
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Не удалось обновить статус.",
          });
        },
      },
    );
  };

  // --- Render Loading/Error ---

  if (isLoading) {
    return (
      <div className="flex flex-col py-20 items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Загрузка списка заказчиков...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col py-20 items-center justify-center text-red-500">
        <X className="h-10 w-10 mb-2" />
        <p>Не удалось загрузить данные. Попробуйте обновить страницу.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Пользователь</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Модерация</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((customer) => {
              // 4. CHECK ONLINE STATUS
              const isOnline = onlineUsers.includes(customer.id);

              return (
                <TableRow key={customer.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* AVATAR WITH ONLINE DOT */}
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-gray-200">
                          <AvatarImage src={customer.profile_picture || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {customer.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {/* Status Indicator */}
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white transition-colors duration-300 ${
                            isOnline ? "bg-green-500" : "bg-gray-300"
                          }`}
                          title={isOnline ? "Online" : "Offline"}
                        />
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {customer.name}
                          </p>
                          {isOnline && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              Online
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {customer.city} • {formatPhoneNumber(customer.phone)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">{customer.email}</TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(customer.created_at)}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        customer.status === "active"
                          ? "border-green-200 text-green-700 bg-green-50"
                          : "border-red-200 text-red-700 bg-red-50"
                      }
                    >
                      {customer.status === "active"
                        ? "Активен"
                        : "Заблокирован"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        customer.moderation_status === "approved"
                          ? "default"
                          : customer.moderation_status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {customer.moderation_status === "approved"
                        ? "Одобрен"
                        : customer.moderation_status === "rejected"
                          ? "Отклонен"
                          : "На проверке"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleStartChat(customer.id)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Написать сообщение
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(customer)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Изменить статус
                        </DropdownMenuItem>

                        <DropdownMenuItem>Подробности</DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(page - 1)}
              aria-disabled={page === 1}
              className={
                page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>
          {Array.from({ length: data?.meta.totalPages || 1 }).map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handlePageChange(i + 1)}
                isActive={page === i + 1}
                className="cursor-pointer"
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(page + 1)}
              aria-disabled={page === data?.meta.totalPages}
              className={
                page === data?.meta.totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* --- EDIT MODAL --- */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Модерация заказчика</DialogTitle>
            <DialogDescription>
              Выберите новый статус для пользователя{" "}
              <span className="font-semibold text-foreground">
                {selectedCustomer?.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium text-right">Статус</span>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_approval">
                    ⏳ Ожидает проверки
                  </SelectItem>
                  <SelectItem value="approved">✅ Одобрен</SelectItem>
                  <SelectItem value="rejected">❌ Отклонен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveStatus}
              disabled={
                isUpdating || newStatus === selectedCustomer?.moderation_status
              }
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
