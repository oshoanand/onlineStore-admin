"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useAdminUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  AdminUser,
} from "@/services/user";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Search,
  Filter,
  ShieldAlert,
  UserCog,
  Shield,
  Headset,
  User as UserIcon,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMobile, maskMobile } from "@/utils/helper";

// ==========================================
// 1. ZOD VALIDATION & UTILS
// ==========================================

const userSchema = z
  .object({
    isEditing: z.boolean(),
    name: z.string().min(2, "Имя обязательно (мин. 2 символа)"),
    // Email is entirely optional now
    email: z
      .string()
      .email("Неверный формат email")
      .optional()
      .or(z.literal("")),
    // +7 (999) 999-99-99 is exactly 18 characters
    mobile: z.string().min(18, "Заполните номер полностью"),
    password: z.string().optional(),
    role: z.enum(["ADMINISTRATOR", "SUPPORT", "COURIER"]),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
  })
  .superRefine((data, ctx) => {
    if (!data.isEditing && (!data.password || data.password.length < 8)) {
      ctx.addIssue({
        path: ["password"],
        code: z.ZodIssueCode.custom,
        message: "Пароль обязателен (мин. 8 символов)",
      });
    }
    if (data.password && data.password.length > 0) {
      if (data.password.length < 8) {
        ctx.addIssue({
          path: ["password"],
          code: z.ZodIssueCode.custom,
          message: "Пароль должен содержать минимум 8 символов",
        });
      }
      if (!/[A-Z]/.test(data.password)) {
        ctx.addIssue({
          path: ["password"],
          code: z.ZodIssueCode.custom,
          message: "Пароль должен содержать заглавную букву (A-Z)",
        });
      }
    }
  });

type UserFormValues = z.infer<typeof userSchema>;

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function UserManagementPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const { data: users = [], isLoading, isError } = useAdminUsersQuery();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const isAdmin = session?.user?.role === "ADMINISTRATOR";
  const currentUserId = session?.user?.id;

  // React Hook Form Setup
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      isEditing: false,
      name: "",
      email: "",
      mobile: "",
      password: "",
      role: "ADMINISTRATOR",
      status: "ACTIVE",
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email &&
          user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.mobile &&
          user.mobile.includes(searchQuery.replace(/\D/g, "").slice(-10))); // Matches raw digits

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    form.reset({
      isEditing: false,
      name: "",
      email: "",
      mobile: "",
      password: "",
      role: "ADMINISTRATOR",
      status: "ACTIVE",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    form.reset({
      isEditing: true,
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile ? formatMobile(user.mobile) : "",
      password: "",
      role: user.role as any,
      status: user.status as any,
    });
    setIsDialogOpen(true);
  };

  const handleMobileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    onChange(maskMobile(e.target.value));
  };

  const onSubmit = async (data: UserFormValues) => {
    // Extract the raw 10 digit number
    const finalMobile = data.mobile.replace(/\D/g, "").slice(-10);

    const payload = {
      name: data.name,
      email: data.email || undefined, // Prevents sending empty strings
      mobile: finalMobile,
      password: data.password,
      role: data.role,
      status: data.status,
    };

    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          data: payload,
        });
        toast({
          title: "Успешно",
          description: "Данные пользователя обновлены",
          variant: "success",
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: "Успешно",
          description: "Новый пользователь создан",
          variant: "success",
        });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          error.response?.data?.message || "Не удалось сохранить изменения",
      });
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (user.id === currentUserId) return;
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.name}?`))
      return;

    try {
      await deleteMutation.mutateAsync(user.id);
      toast({
        title: "Удалено",
        description: "Пользователь был удален из системы",
        variant: "success",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "SUPPORT":
        return <Headset className="h-4 w-4 text-blue-500" />;
      case "COURIER":
        return <Truck className="h-4 w-4 text-green-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-slate-500" />;
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-red-500 gap-4">
        <ShieldAlert className="h-16 w-16" />
        <div className="text-center">
          <h2 className="text-xl font-bold">Ошибка доступа</h2>
          <p className="text-muted-foreground">
            Не удалось загрузить пользователей. Проверьте права доступа.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-md font-semibold tracking-tight uppercase text-slate-900 dark:text-white">
            Пользователи
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Управление учетными записями, ролями и доступами.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleOpenCreate}
            className="shadow-sm bg-[#005BFF] hover:bg-blue-700 text-white font-bold px-6"
          >
            <Plus className="mr-2 h-4 w-4" /> Добавить
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#005BFF] transition-colors" />
            <Input
              placeholder="Поиск по имени, телефону или email..."
              className="pl-9 bg-background focus-visible:ring-[#005BFF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px] font-semibold">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Роль" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">
                Все роли
              </SelectItem>
              <SelectItem value="ADMINISTRATOR" className="font-medium">
                Администраторы
              </SelectItem>
              <SelectItem value="SUPPORT" className="font-medium">
                Поддержка
              </SelectItem>
              <SelectItem value="COURIER" className="font-medium">
                Курьеры
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-semibold text-slate-500 whitespace-nowrap">
          Найдено:{" "}
          <span className="font-medium text-slate-900 dark:text-white text-md">
            {filteredUsers.length}
          </span>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="w-[300px] font-black text-slate-500 uppercase text-[11px] tracking-wider">
                    Пользователь
                  </TableHead>
                  <TableHead className="font-black text-slate-500 uppercase text-[11px] tracking-wider">
                    Роль
                  </TableHead>
                  <TableHead className="font-black text-slate-500 uppercase text-[11px] tracking-wider">
                    Статус
                  </TableHead>
                  <TableHead className="hidden md:table-cell font-black text-slate-500 uppercase text-[11px] tracking-wider">
                    Дата регистрации
                  </TableHead>
                  {isAdmin && (
                    <TableHead className="text-right font-black text-slate-500 uppercase text-[11px] tracking-wider">
                      Действия
                    </TableHead>
                  )}
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
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                        <UserCog className="h-12 w-12 opacity-50" />
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          Пользователи не найдены.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b-slate-100 dark:border-b-slate-800"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-slate-100 dark:border-slate-800">
                            <AvatarImage
                              src={
                                (user as any).profilePhoto ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                              }
                            />
                            <AvatarFallback className="font-bold bg-blue-50 text-blue-700">
                              {user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-[15px]">
                              {user.name || "Без имени"}
                              {user.id === currentUserId && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0"
                                >
                                  Вы
                                </Badge>
                              )}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              {formatMobile(user.mobile)}{" "}
                              {user.email && `• ${user.email}`}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center w-fit border gap-1.5 ${
                            user.role === "ADMINISTRATOR"
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : user.role === "SUPPORT"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {getRoleIcon(user.role)}{" "}
                          {user.role === "ADMINISTRATOR"
                            ? "Админ"
                            : user.role === "SUPPORT"
                              ? "Саппорт"
                              : "Курьер"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                            user.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-green-600" : "bg-red-500"}`}
                          />
                          {user.status === "ACTIVE"
                            ? "Активен"
                            : "Заблокирован"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-medium text-slate-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("ru-RU")
                          : "—"}
                      </TableCell>

                      {isAdmin && (
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
                              className="w-48 font-medium"
                            >
                              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-400">
                                Действия
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(user)}
                                className="cursor-pointer"
                              >
                                <Pencil className="mr-2 h-4 w-4 text-blue-500" />{" "}
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(user)}
                                disabled={user.id === currentUserId}
                                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- Validated Form Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 rounded-3xl">
          <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              {editingUser ? "Редактирование профиля" : "Новый пользователь"}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              {editingUser
                ? "Обновите информацию о пользователе и права доступа."
                : "Создайте нового пользователя для доступа к системе."}
            </DialogDescription>
          </DialogHeader>

          {/* Form wrapper connects the submit button natively */}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* NAME */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label
                    htmlFor="name"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    Имя пользователя <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Иван Иванов"
                    {...form.register("name")}
                    className={`bg-slate-50 dark:bg-slate-900 ${form.formState.errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-500 font-bold">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* MOBILE */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label
                    htmlFor="mobile"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    Телефон <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="+7 (999) 000-00-00"
                        value={field.value}
                        onChange={(e) => handleMobileChange(e, field.onChange)}
                        className={`bg-slate-50 dark:bg-slate-900 font-semibold ${form.formState.errors.mobile ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                    )}
                  />
                  {form.formState.errors.mobile && (
                    <p className="text-xs text-red-500 font-bold">
                      {form.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                {/* EMAIL (Optional) */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label
                    htmlFor="email"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    Email адрес (Необязательно)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...form.register("email")}
                    className={`bg-slate-50 dark:bg-slate-900 ${form.formState.errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-500 font-bold">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label
                    htmlFor="password"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    Пароль{" "}
                    {!editingUser && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={
                      editingUser
                        ? "•••••••• (оставьте пустым)"
                        : "Мин. 8 символов, 1 Заглавная"
                    }
                    {...form.register("password")}
                    className={`bg-slate-50 dark:bg-slate-900 ${form.formState.errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500 font-bold">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* ROLE */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label
                    htmlFor="role"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    Роль в системе
                  </Label>
                  <Controller
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-slate-50 dark:bg-slate-900 font-semibold border-slate-200">
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="ADMINISTRATOR"
                            className="font-medium"
                          >
                            Администратор
                          </SelectItem>
                          <SelectItem value="SUPPORT" className="font-medium">
                            Поддержка
                          </SelectItem>
                          <SelectItem value="COURIER" className="font-medium">
                            Курьер
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* STATUS */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label
                    htmlFor="status"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    Статус аккаунта
                  </Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-slate-50 dark:bg-slate-900 font-semibold border-slate-200">
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE" className="font-medium">
                            Активен
                          </SelectItem>
                          <SelectItem
                            value="BLOCKED"
                            className="font-medium text-red-600"
                          >
                            Заблокирован
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="font-bold text-slate-500"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[140px] bg-[#005BFF] hover:bg-blue-700 text-white font-bold active:scale-95 transition-transform"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingUser ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
