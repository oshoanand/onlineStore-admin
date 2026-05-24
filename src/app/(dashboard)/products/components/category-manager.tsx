"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2, Upload, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

import { useCreateCategory, useCategories } from "@/services/category";
import { transliterate } from "../new/page";

const categorySchema = z.object({
  name: z.string().min(2, "Название должно содержать минимум 2 символа"),
  slug: z.string().min(2, "Slug обязателен"),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryManagerDialog() {
  const [open, setOpen] = useState(false);
  const [thumb, setThumb] = useState<File | null>(null);
  const [isSlugAuto, setIsSlugAuto] = useState(true);

  const { toast } = useToast();
  const { data: categoryResponse } = useCategories();
  const { mutate: createCategory, isPending } = useCreateCategory();

  const allCategories = categoryResponse?.data || [];
  const topLevelCategories = allCategories.filter((c: any) => !c.parentId);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "", parentId: "none" },
  });

  const name = form.watch("name");

  useEffect(() => {
    if (name && isSlugAuto) {
      form.setValue("slug", transliterate(name), { shouldValidate: true });
    } else if (isSlugAuto) {
      form.setValue("slug", "");
    }
  }, [name, isSlugAuto, form]);

  const { onChange: onSlugChange, ...slugFieldRest } = form.register("slug");

  const onSubmit = (values: CategoryFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("slug", values.slug);

    if (values.description) formData.append("description", values.description);
    if (values.parentId && values.parentId !== "none")
      formData.append("parentId", values.parentId);
    if (thumb) formData.append("thumbImage", thumb);

    createCategory(formData, {
      onSuccess: () => {
        toast({
          title: "Успешно",
          description: "Категория добавлена.",
          variant: "success",
        });
        setOpen(false);
        form.reset();
        setThumb(null);
        setIsSlugAuto(true);
      },
      onError: (err: any) => {
        toast({
          title: "Ошибка",
          description:
            err.response?.data?.message || "Не удалось создать категорию",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className="w-full border-dashed border-2 hover:bg-slate-50 dark:hover:bg-slate-900 text-blue-600 hover:text-blue-700 font-semibold h-11"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Создать новую категорию
        </Button>
      </DialogTrigger>

      {/* 🚨 FIX: Added max-h-[90vh] and flex-col layout to restrict dialog height */}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
        {/* 🚨 FIX: Moved padding to Header so it sticks to the top */}
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Новая категория</DialogTitle>
        </DialogHeader>

        {/* 🚨 FIX: Made the form container scrollable with overflow-y-auto */}
        <div className="px-6 py-2 overflow-y-auto flex-1">
          <form
            id="category-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Название</Label>
              <Input
                id="cat-name"
                placeholder="Например: Оборудование"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-slug">URL (Slug)</Label>
              <Input
                id="cat-slug"
                placeholder="oborudovanie"
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
              <Label>Родительская категория (Необязательно)</Label>
              <Select
                onValueChange={(val) => form.setValue("parentId", val)}
                value={form.watch("parentId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Сделать главной категорией" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-bold">
                    -- Главная категория (Без родителя) --
                  </SelectItem>
                  {topLevelCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-desc">Описание</Label>
              <Textarea
                id="cat-desc"
                placeholder="Короткое описание категории..."
                className="h-20 resize-none"
                {...form.register("description")}
              />
            </div>

            <div className="grid gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label>Иконка / Изображение категории</Label>
              {thumb ? (
                <div className="relative w-full h-32 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(thumb)}
                    alt="Preview"
                    className="h-full object-contain"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button" // Fix: Prevent submitting form when deleting image
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={() => setThumb(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors h-32">
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
          </form>
        </div>

        {/* 🚨 FIX: Moved buttons to a sticky footer area outside the scrollable body */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-end gap-3 bg-white dark:bg-slate-950">
          <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            type="submit"
            form="category-form" // Triggers the form above
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
