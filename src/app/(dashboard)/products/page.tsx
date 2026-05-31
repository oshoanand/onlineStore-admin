"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  ArrowUpDown,
  MoreHorizontal,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import {
  useAdminProducts,
  useDeleteProduct,
  useUpdateProductStatus,
  ProductStatus,
} from "@/services/product";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/utils/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// --- Russian Translations for Status ---
const statusTranslations: Record<ProductStatus, string> = {
  ACTIVE: "Активен",
  INACTIVE: "Неактивен",
  OUT_OF_STOCK: "Нет в наличии",
  ARCHIVED: "В архиве",
};

export default function AdminProductsPage() {
  const { toast } = useToast();

  // --- Table & Filter State ---
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // --- Debounce Logic (Wait 500ms after typing stops) ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // --- Data Fetching ---
  const {
    data: response,
    isLoading,
    isFetching,
  } = useAdminProducts({
    page,
    limit: 10,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });

  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateProductStatus();

  // --- Status Dialog State ---
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    status: ProductStatus;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<ProductStatus>("ACTIVE");

  // --- Handlers ---
  const openStatusDialog = (id: string, currentStatus: ProductStatus) => {
    setSelectedProduct({ id, status: currentStatus });
    setNewStatus(currentStatus); // Set default value to current status
    setIsStatusDialogOpen(true);
  };

  const handleStatusSubmit = () => {
    if (!selectedProduct) return;
    updateStatus(
      { id: selectedProduct.id, status: newStatus },
      {
        onSuccess: () => {
          toast({
            title: `Статус изменен на: ${statusTranslations[newStatus]}`,
            variant: "success",
          });
          setIsStatusDialogOpen(false);
        },
        onError: () => {
          toast({
            title: "Ошибка при изменении статуса",
            variant: "destructive",
          });
        },
      },
    );
  };

  const products = response?.data || [];
  const meta = response?.meta;

  // --- Handlers ---
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.",
      )
    ) {
      deleteProduct(id, {
        onSuccess: () =>
          toast({ variant: "success", title: "Товар успешно удален" }),
        onError: () =>
          toast({
            variant: "destructive",
            title: "Ошибка при удалении товара",
          }),
      });
    }
  };

  const toggleStatus = (id: string, currentStatus: ProductStatus) => {
    // If it's out of stock, toggle brings it back to active (assuming stock was updated manually)
    const newStatus: ProductStatus =
      currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    updateStatus(
      { id, status: newStatus },
      {
        onSuccess: () =>
          toast({
            title: `Статус изменен на: ${statusTranslations[newStatus]}`,
          }),
      },
    );
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 p-4">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Каталог товаров</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" /> Управляйте ассортиментом, остатками
            и ценами.
          </p>
        </div>
        <Button asChild className="shadow-md">
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" /> Добавить товар
          </Link>
        </Button>
      </div>

      {/* 2. Filters & Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или артикулу..."
            className="pl-9 bg-white dark:bg-slate-950"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* 3. Modern Data Table */}
      <div className="border rounded-xl bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead className="w-[300px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="font-bold -ml-4"
                >
                  Товар <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("price")}
                  className="font-bold -ml-4"
                >
                  Цена <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("inStock")}
                  className="font-bold -ml-4"
                >
                  Остаток <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Категории</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-12 w-12 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  Товары не найдены в базе данных.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-slate-100 dark:bg-slate-800">
                        <img
                          src={getImageUrl(product.thumbImage)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/images/default-product.png";
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {product.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {product.discountedPrice ? (
                        <>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {Number(product.discountedPrice).toLocaleString(
                              "ru-RU",
                            )}{" "}
                            ₽
                          </span>

                          <span className=" text-[10px] line-through text-muted-foreground ">
                            {Number(product.price).toLocaleString("ru-RU")} ₽
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {Number(product.price).toLocaleString("ru-RU")} ₽
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          product.inStock < 5
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }
                      >
                        {product.inStock} шт.
                      </Badge>
                      {product.inStock < 5 && (
                        <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {/* Use ?. and || [] to safely handle missing or null categories */}
                      {(product.categories || []).slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800"
                        >
                          {cat}
                        </span>
                      ))}
                      {/* Check length safely */}
                      {(product.categories?.length || 0) > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{(product.categories?.length || 0) - 2} ещё
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "ACTIVE" ? "default" : "outline"
                      }
                      className={
                        ["OUT_OF_STOCK", "INACTIVE"].includes(product.status)
                          ? "border-red-500 text-red-600 dark:text-red-400"
                          : ""
                      }
                    >
                      {statusTranslations[product.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/products/edit/${product.id}`}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Редактировать
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openStatusDialog(product.id, product.status)
                          }
                          className="cursor-pointer"
                        >
                          <Package className="mr-2 h-4 w-4" /> Изменить статус
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                          onClick={() => handleDelete(product.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Удалить товар
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pb-4">
          <p className="text-xs text-muted-foreground">
            Показано{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {products.length}
            </span>{" "}
            из{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {meta.total}
            </span>{" "}
            товаров
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Назад
            </Button>
            <div className="text-xs font-medium px-4">
              Страница {page} из {meta.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === meta.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Далее
            </Button>
          </div>
        </div>
      )}
      {/* 5. Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>Изменить статус товара</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Новый статус</Label>
              <Select
                value={newStatus}
                onValueChange={(val: ProductStatus) => setNewStatus(val)}
              >
                <SelectTrigger className="bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusTranslations).map(([key, label]) => (
                    <SelectItem key={key} value={key as ProductStatus}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              Отмена
            </Button>
            <Button
              onClick={handleStatusSubmit}
              disabled={
                isUpdatingStatus || selectedProduct?.status === newStatus
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdatingStatus ? (
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
