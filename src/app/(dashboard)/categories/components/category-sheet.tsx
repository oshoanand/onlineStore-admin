"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import {
  useCreateCategory,
  useUpdateCategory,
  useAdminCategories,
} from "@/services/category";
import { getImageUrl } from "@/utils/image";
import { transliterate } from "../../products/new/page"; // Import from your products page

const categorySchema = z.object({
  name: z.string().min(2, "Название должно содержать минимум 2 символа"),
  slug: z.string().min(2, "Slug обязателен"),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any | null; // Pass null for creating a new category
  preselectedParentId?: string | null; // For quick-adding a subcategory
}

export function CategorySheet({
  open,
  onOpenChange,
  editData,
  preselectedParentId,
}: CategorySheetProps) {
  const { toast } = useToast();
  const [thumb, setThumb] = useState<File | null>(null);
  const [isSlugAuto, setIsSlugAuto] = useState(true);

  // Queries & Mutations
  const { data: catResponse } = useAdminCategories();
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  const isPending = isCreating || isUpdating;
  const allCategories = catResponse?.data || [];

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "", parentId: "none" },
  });

  // Pre-fill form when editing or quick-adding subcategory
  useEffect(() => {
    if (open) {
      if (editData) {
        form.reset({
          name: editData.name || "",
          slug: editData.slug || "",
          description: editData.description || "",
          parentId: editData.parentId || "none",
        });
        setIsSlugAuto(false);
        setThumb(null);
      } else {
        form.reset({
          name: "",
          slug: "",
          description: "",
          parentId: preselectedParentId || "none",
        });
        setIsSlugAuto(true);
        setThumb(null);
      }
    }
  }, [open, editData, preselectedParentId, form]);

  const name = form.watch("name");

  useEffect(() => {
    if (name && isSlugAuto && !editData) {
      form.setValue("slug", transliterate(name), { shouldValidate: true });
    }
  }, [name, isSlugAuto, editData, form]);

  const { onChange: onSlugChange, ...slugFieldRest } = form.register("slug");

  const onSubmit = (values: CategoryFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("slug", values.slug);

    if (values.description) formData.append("description", values.description);
    if (values.parentId && values.parentId !== "none")
      formData.append("parentId", values.parentId);
    if (thumb) formData.append("thumbImage", thumb);

    const handleSuccess = () => {
      toast({
        title: "Успешно",
        description: "Категория сохранена.",
        variant: "success",
      });
      onOpenChange(false);
    };

    const handleError = (err: any) => {
      toast({
        title: "Ошибка",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    };

    if (editData) {
      updateCategory(
        { id: editData.id, data: formData },
        { onSuccess: handleSuccess, onError: handleError },
      );
    } else {
      createCategory(formData, {
        onSuccess: handleSuccess,
        onError: handleError,
      });
    }
  };

  // Helper to build a flat list with indentation for the Parent Dropdown
  const buildOptions = (
    cats: any[],
    parentId: string | null = null,
    level = 0,
  ): any[] => {
    let options: any[] = [];
    const children = cats.filter((c) => c.parentId === parentId);
    for (const child of children) {
      // Prevent selecting itself or its own children as a parent
      if (editData && child.id === editData.id) continue;

      options.push({ ...child, level });
      options = options.concat(buildOptions(cats, child.id, level + 1));
    }
    return options;
  };

  const categoryOptions = buildOptions(allCategories);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-50 dark:bg-slate-950 p-0 flex flex-col">
        <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetHeader>
            <SheetTitle>
              {editData ? "Редактировать категорию" : "Новая категория"}
            </SheetTitle>
            <SheetDescription>
              {editData
                ? "Измените настройки существующей категории."
                : "Создайте новую категорию для организации каталога."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <form
          id="category-sheet-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-6 space-y-6 flex-1"
        >
          <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="grid gap-2">
              <Label>
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Например: Мужская одежда"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>
                URL (Slug) <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="mens-clothing"
                {...slugFieldRest}
                onChange={(e) => {
                  setIsSlugAuto(false);
                  onSlugChange(e);
                }}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Вложенность (Родитель)</Label>
              <Select
                onValueChange={(val) => form.setValue("parentId", val)}
                value={form.watch("parentId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Сделать главной категорией" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-bold text-blue-600">
                    -- Корень (Главная категория) --
                  </SelectItem>
                  {categoryOptions.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="text-slate-400 mr-1">
                        {"—".repeat(cat.level)}
                      </span>{" "}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="grid gap-2">
              <Label>Иконка / Изображение</Label>
              {thumb || editData?.thumbImage ? (
                <div className="relative w-full h-40 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img
                    src={
                      thumb
                        ? URL.createObjectURL(thumb)
                        : getImageUrl(editData.thumbImage)
                    }
                    alt="Preview"
                    className="h-full object-contain"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={() => {
                      setThumb(null);
                      if (editData) editData.thumbImage = null;
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors h-40">
                  <Upload className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-600">
                    Загрузить фото (До 5MB)
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setThumb(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Описание (Для SEO)</Label>
              <Textarea
                placeholder="Описание категории..."
                className="h-24 resize-none"
                {...form.register("description")}
              />
            </div>
          </div>
        </form>

        <SheetFooter className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            type="submit"
            form="category-sheet-form"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editData ? "Обновить" : "Создать"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
