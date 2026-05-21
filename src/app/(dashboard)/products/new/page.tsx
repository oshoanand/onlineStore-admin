"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ChevronLeft, Upload, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import TiptapEditor from "@/components/tiptap-editor";
import { useToast } from "@/hooks/use-toast";

import { useCreateProduct } from "@/services/product";
import { useCategories } from "@/services/category";
import { CategoryManagerDialog } from "../components/category-manager";

// ==========================================
// 1. ФУНКЦИЯ ТРАНСЛИТЕРАЦИИ (РУС -> ЛАТ)
// ==========================================
const transliterate = (text: string) => {
  const cyrillicToLatinMap: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => cyrillicToLatinMap[char] || char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// ==========================================
// 2. ZOD СХЕМА ВАЛИДАЦИИ
// ==========================================
const productSchema = z.object({
  name: z.string().min(3, "Название обязательно (минимум 3 символа)"),
  slug: z.string().min(3, "ЧПУ (Slug) обязателен"),
  sku: z.string().min(3, "Артикул обязателен"),
  description: z
    .string()
    .min(10, "Краткое описание обязательно (минимум 10 символов)"),
  detailedDescription: z.string().optional(),

  price: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val >= 0.01, "Цена должна быть больше 0"),

  discountedPrice: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === "" || val === undefined ? undefined : Number(val),
    ),

  inStock: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Остаток не может быть отрицательным"),

  categoryId: z.string().min(1, "Выберите главную категорию"),
  subCategoryId: z.string().optional(),

  weight: z.string().optional(),
  dimensions: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "ARCHIVED"]),
  isPublished: z.boolean(),
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [images, setImages] = useState<File[]>([]);
  const [thumb, setThumb] = useState<File | null>(null);
  const [isSlugAuto, setIsSlugAuto] = useState(true);

  // API Hooks
  const { mutate: createProduct, isPending } = useCreateProduct();
  const { data: categoryResponse, isLoading: isLoadingCats } = useCategories();
  const allCategories = categoryResponse?.data || [];

  // ==========================================
  // 3. НАСТРОЙКА ФОРМЫ (React Hook Form)
  // ==========================================
  const form = useForm<ProductFormInput, any, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      description: "",
      detailedDescription: "",
      price: 0,
      discountedPrice: undefined,
      inStock: 0,
      categoryId: "",
      subCategoryId: "",
      weight: "",
      dimensions: "",
      color: "",
      status: "ACTIVE",
      isPublished: true,
    },
  });

  const name = form.watch("name");
  const selectedCategoryId = form.watch("categoryId");

  // Автогенерация ЧПУ и артикула
  useEffect(() => {
    if (name) {
      if (isSlugAuto) {
        form.setValue("slug", transliterate(name), { shouldValidate: true });
      }

      if (!form.getValues("sku")) {
        const prefix =
          transliterate(name).substring(0, 3).toUpperCase() || "PRD";
        const generatedSku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        form.setValue("sku", generatedSku, { shouldValidate: false });
      }
    } else if (isSlugAuto) {
      form.setValue("slug", "", { shouldValidate: false });
    }
  }, [name, isSlugAuto, form]);

  // Сброс подкатегории при смене главной категории
  useEffect(() => {
    form.setValue("subCategoryId", "");
  }, [selectedCategoryId, form]);

  // Обработчик для ручного ввода slug
  const { onChange: onSlugChange, ...slugFieldRest } = form.register("slug");

  // ==========================================
  // 4. ОТПРАВКА ФОРМЫ
  // ==========================================
  const onSubmit = async (values: ProductFormOutput) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      // Игнорируем пустые опциональные поля (в т.ч. фиктивное "none" для подкатегории)
      if (value !== undefined && value !== "" && value !== "none") {
        formData.append(key, String(value));
      }
    });

    if (thumb) formData.append("thumbImage", thumb);
    images.forEach((img) => formData.append("imageArray", img));

    createProduct(formData, {
      onSuccess: () => {
        toast({
          title: "Успешно!",
          description: "Товар успешно добавлен в каталог.",
          variant: "success",
        });
        router.push("/products");
      },
      onError: (err: any) => {
        toast({
          title: "Ошибка при создании товара",
          description:
            err.response?.data?.message || err.message || "Что-то пошло не так",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 pb-20 animate-in fade-in duration-500"
    >
      {/* ==========================================
          ШАПКА
      ========================================== */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            type="button"
            className="bg-white dark:bg-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Добавить товар
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="shadow-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить товар
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ==========================================
            ЛЕВАЯ КОЛОНКА
        ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Название товара <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Например: Премиум корм для осетра"
                  className={form.formState.errors.name ? "border-red-500" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="slug">
                    ЧПУ (Slug) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    {...slugFieldRest}
                    onChange={(e) => {
                      setIsSlugAuto(false);
                      onSlugChange(e);
                    }}
                    placeholder="premium-korm-osetr"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Можно редактировать вручную
                  </p>
                  {form.formState.errors.slug && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sku">
                    Артикул (SKU) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sku"
                    {...form.register("sku")}
                    placeholder="PRM-001"
                  />
                  {form.formState.errors.sku && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.sku.message}
                    </p>
                  )}
                </div>
              </div>

              {/* УПРАВЛЕНИЕ КАТЕГОРИЯМИ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="grid gap-2">
                  <Label>
                    Главная категория <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(val) => form.setValue("categoryId", val)}
                    value={form.watch("categoryId")}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-950">
                      <SelectValue
                        placeholder={
                          isLoadingCats ? "Загрузка..." : "Выберите категорию"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories
                        .filter((c) => !c.parentId)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Подкатегория</Label>
                  <Select
                    disabled={!selectedCategoryId}
                    onValueChange={(val) =>
                      form.setValue("subCategoryId", val === "none" ? "" : val)
                    }
                    value={form.watch("subCategoryId") || "none"}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Выберите подкатегорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        -- Нет подкатегории --
                      </SelectItem>
                      {allCategories
                        .filter((c) => c.parentId === selectedCategoryId)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <CategoryManagerDialog />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">
                  Краткое описание <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Короткий текст, который будет виден в карточке товара..."
                  className="resize-none h-20"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Подробное описание (Rich Text)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <TiptapEditor
                    content=""
                    onChange={(html) =>
                      form.setValue("detailedDescription", html)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* МЕДИА ГАЛЕРЕЯ */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle>Галерея медиа</CardTitle>
              <CardDescription>
                Загрузите изображения для товара.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Главное изображение (Миниатюра)</Label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer relative min-h-[200px]">
                    {thumb ? (
                      <div className="relative w-full h-40">
                        <img
                          src={URL.createObjectURL(thumb)}
                          className="w-full h-full object-contain rounded-md"
                          alt="Thumb"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md"
                          onClick={(e) => {
                            e.preventDefault();
                            setThumb(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) =>
                            setThumb(e.target.files?.[0] || null)
                          }
                          accept="image/*"
                        />
                        <Upload className="h-10 w-10 text-slate-400 mb-3" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          Загрузить главное фото
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          PNG, JPG до 5MB
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Изображения галереи (Макс. 4)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900"
                      >
                        <img
                          src={URL.createObjectURL(img)}
                          className="w-full h-full object-cover"
                          alt="gallery"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setImages(images.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-md p-1 shadow hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <div className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <input
                          type="file"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setImages((prev) =>
                              [...prev, ...files].slice(0, 4),
                            );
                          }}
                          accept="image/*"
                        />
                        <Upload size={24} className="text-slate-400 mb-2" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Добавить
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==========================================
            ПРАВАЯ КОЛОНКА
        ========================================== */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle>Статус и Цены</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">
                    Опубликовано
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Показывать товар клиентам
                  </p>
                </div>
                <Switch
                  checked={form.watch("isPublished")}
                  onCheckedChange={(val) => form.setValue("isPublished", val)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="grid gap-2">
                <Label>Статус наличия</Label>
                <Select
                  onValueChange={(v: any) => form.setValue("status", v)}
                  defaultValue="ACTIVE"
                >
                  <SelectTrigger className="bg-white dark:bg-slate-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Активен</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Нет в наличии</SelectItem>
                    <SelectItem value="INACTIVE">Неактивен</SelectItem>
                    <SelectItem value="ARCHIVED">В архиве</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="grid gap-2">
                  <Label>
                    Цена (₽) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("price")}
                    placeholder="0.00"
                  />
                  {form.formState.errors.price && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Со скидкой (₽)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("discountedPrice")}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Label>
                  Остаток на складе (шт.){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  {...form.register("inStock")}
                  placeholder="0"
                />
                {form.formState.errors.inStock && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.inStock.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-indigo-50/50 dark:bg-indigo-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Характеристики
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Вес
                </Label>
                <Input
                  {...form.register("weight")}
                  placeholder="Например: 1 кг"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Габариты (ДxШxВ)
                </Label>
                <Input
                  {...form.register("dimensions")}
                  placeholder="Например: 10x10x10 см"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Цвет / Окрас
                </Label>
                <Input
                  {...form.register("color")}
                  placeholder="Например: Белый"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
