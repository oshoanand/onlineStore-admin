"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { apiRequest } from "@/services/http/api-client";

// --- Custom Hooks ---
import {
  usePerformersQuery,
  useUpdateModerationMutation,
  Performer,
} from "@/data/use-performers";
import { useSocket } from "@/components/providers/socket-provider";

export default function PerformersTable() {
  const { toast } = useToast();
  const router = useRouter();

  // 1. Real-Time Online Status
  // We extract onlineUsers from the socket context to check user presence
  const { onlineUsers } = useSocket() || { onlineUsers: [] };

  // --- State ---
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState<string>("");

  // --- Data Fetching ---
  const { data, isLoading, isError } = usePerformersQuery(page, limit);
  const { mutate: updateModeration, isPending: isUpdating } =
    useUpdateModerationMutation();

  // --- Handlers ---

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.meta.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const handleOpenEdit = (performer: Performer) => {
    setSelectedPerformer(performer);
    setNewStatus(performer.moderation_status);
    setIsEditModalOpen(true);
  };

  // 2. Chat Creation Handler
  const handleStartChat = async (performerId: string) => {
    try {
      // Call API to create a room or get existing one
      const res = await apiRequest<{ id: string }>({
        method: "post",
        url: "/api/chats/create",
        data: { targetUserId: performerId },
      });

      // Redirect Admin to the Chat Page
      router.push(`/chat/${res.id}`);
    } catch (error) {
      console.error("Chat creation failed", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось открыть чат с пользователем.",
      });
    }
  };

  const handleSaveStatus = () => {
    if (!selectedPerformer) return;

    updateModeration(
      { id: selectedPerformer.id, status: newStatus },
      {
        onSuccess: () => {
          toast({
            title: "Успех",
            description: "Статус модерации успешно обновлен.",
            className: "bg-green-600 text-white border-green-700",
          });
          setIsEditModalOpen(false);
          setSelectedPerformer(null);
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
        <p>Загрузка списка исполнителей...</p>
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
              <TableHead>Статус аккаунта</TableHead>
              <TableHead>Модерация</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((performer) => {
              // Check if specific user is online
              const isOnline = onlineUsers.includes(performer.id);

              return (
                <TableRow key={performer.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Avatar with Online Indicator */}
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-gray-200">
                          <AvatarImage src={performer.profile_picture || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {performer.name?.substring(0, 2).toUpperCase() ||
                              "UN"}
                          </AvatarFallback>
                        </Avatar>

                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white transition-colors duration-300 ${
                            isOnline ? "bg-green-500" : "bg-gray-300"
                          }`}
                          title={isOnline ? "Online" : "Offline"}
                        />
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {performer.name}
                          </span>
                          {isOnline && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                              Online
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {performer.city} •{" "}
                          {formatPhoneNumber(performer.phone)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">{performer.email}</TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(performer.created_at)}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        performer.status === "active"
                          ? "border-green-200 text-green-700 bg-green-50"
                          : "border-red-200 text-red-700 bg-red-50"
                      }
                    >
                      {performer.status === "active"
                        ? "Активен"
                        : "Заблокирован"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        performer.moderation_status === "approved"
                          ? "default"
                          : performer.moderation_status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {performer.moderation_status === "approved"
                        ? "Одобрен"
                        : performer.moderation_status === "rejected"
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
                          onClick={() => handleStartChat(performer.id)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Написать сообщение
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(performer)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Изменить статус
                        </DropdownMenuItem>

                        <DropdownMenuItem>Детальный просмотр</DropdownMenuItem>

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

      {/* Pagination */}
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={
                  page === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
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
                className={
                  page === data?.meta.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* --- Edit Status Modal --- */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Модерация исполнителя</DialogTitle>
            <DialogDescription>
              Измените статус для пользователя{" "}
              <span className="font-semibold text-foreground">
                {selectedPerformer?.name}
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
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleSaveStatus}
              disabled={
                isUpdating || newStatus === selectedPerformer?.moderation_status
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
