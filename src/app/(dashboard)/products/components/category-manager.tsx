"use client";

import { useState, useMemo } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  FolderTree,
  Pencil,
  X,
  Check,
} from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  Category,
} from "@/services/category";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function CategoryManagerDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [parentId, setParentId] = useState<string>("root");

  const { data: response, isLoading } = useCategories();
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();

  // Теперь это 100% плоский массив с бекенда
  const categories = response?.data || [];

  // Строим плоский список с отступами для селекта
  const flattenedCategories = useMemo(() => {
    const buildFlatList = (
      currentParentId: string | null,
      depth: number = 0,
    ): (Category & { depth: number })[] => {
      let result: (Category & { depth: number })[] = [];
      const children = categories.filter((c) => c.parentId === currentParentId);

      for (const child of children) {
        result.push({ ...child, depth });
        result = result.concat(buildFlatList(child.id, depth + 1));
      }
      return result;
    };
    return buildFlatList(null);
  }, [categories]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setCatName("");
    setParentId("root");
  };

  const handleSave = () => {
    if (!catName.trim()) return;

    const payload = {
      name: catName,
      parentId: parentId === "root" ? null : parentId,
    };

    if (isEditing && editingId) {
      updateCategory(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Категория обновлена", variant: "success" });
            resetForm();
          },
          onError: (err: any) =>
            toast({
              title: "Ошибка",
              description: err.message,
              variant: "destructive",
            }),
        },
      );
    } else {
      createCategory(payload, {
        onSuccess: () => {
          toast({ title: "Категория создана", variant: "success" });
          resetForm();
        },
        onError: (err: any) =>
          toast({
            title: "Ошибка",
            description: err.message,
            variant: "destructive",
          }),
      });
    }
  };

  const handleEditClick = (cat: Category) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setCatName(cat.name);
    setParentId(cat.parentId || "root");
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Вы уверены? Категории с подкатегориями нельзя удалить без предварительной очистки.",
      )
    ) {
      deleteCategory(id, {
        onSuccess: () => {
          toast({ title: "Категория удалена" });
          if (editingId === id) resetForm();
        },
        onError: (err: any) =>
          toast({
            title: "Ошибка",
            description: err.response?.data?.message || err.message,
            variant: "destructive",
          }),
      });
    }
  };

  // Рекурсивный рендер бесконечного дерева подкатегорий
  const renderCategoryNode = (cat: Category, depth: number = 0) => {
    const children = categories.filter((c) => c.parentId === cat.id);
    const isCurrentlyEditing = editingId === cat.id;

    return (
      <div key={cat.id} className="space-y-1">
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-md border transition-colors ${
            isCurrentlyEditing
              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
              : "bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          <div className="flex items-center gap-2">
            {depth > 0 && <span className="text-slate-400">└</span>}
            <span
              className={`text-sm ${depth === 0 ? "font-semibold" : "text-slate-600 dark:text-slate-300"}`}
            >
              {cat.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-600 dark:text-blue-400"
              onClick={() => handleEditClick(cat)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500"
              onClick={() => handleDelete(cat.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Рекурсивный вызов для всех детей */}
        {children.map((child) => renderCategoryNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="w-full mt-2 border-dashed bg-slate-50 dark:bg-slate-900"
        >
          <FolderTree className="mr-2 h-4 w-4" /> Управление категориями
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl bg-white dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="text-xl">Менеджер категорий</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-4 border-r border-slate-200 dark:border-slate-800 pr-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isEditing ? "Редактирование" : "Добавить новую"}
              </h3>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-6 text-xs px-2 text-muted-foreground"
                >
                  <X className="h-3 w-3 mr-1" /> Отмена
                </Button>
              )}
            </div>

            <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-2">
                <Label>Родительская категория</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="bg-white dark:bg-slate-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="root"
                      className="font-semibold text-blue-600 dark:text-blue-400"
                    >
                      -- Корневая категория --
                    </SelectItem>
                    {flattenedCategories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        disabled={cat.id === editingId}
                      >
                        {"—".repeat(cat.depth)} {cat.depth > 0 ? " " : ""}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isCreating || isUpdating || !catName.trim()}
              >
                {isCreating || isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Сохранить изменения" : "Добавить"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Структура каталога
            </h3>
            <ScrollArea className="h-[350px] pr-4 rounded-md">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : categories.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-4">
                  Категорий пока нет.
                </p>
              ) : (
                <div className="space-y-2 pb-4">
                  {/* Рендерим только корневые элементы, они сами рекурсивно вызовут детей */}
                  {categories
                    .filter((cat) => !cat.parentId)
                    .map((rootCat) => renderCategoryNode(rootCat, 0))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
