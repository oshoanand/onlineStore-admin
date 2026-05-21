"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Save,
  ChevronLeft,
  Upload,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

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

import { useProduct, useUpdateProduct } from "@/services/product";
import { useCategories } from "@/services/category";
import { CategoryManagerDialog } from "../../components/category-manager";
import { getImageUrl } from "@/utils/image";

// ==========================================
// 1. TRANSLITERATION FUNCTION (RUS -> LAT)
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
// 2. ZOD VALIDATION SCHEMA
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
    .transform(Number)
    .refine((val) => val >= 0.01, "Цена должна быть больше 0"),
  discountedPrice: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === "" || val === undefined ? undefined : Number(val),
    ),
  inStock: z
    .union([z.string(), z.number()])
    .transform(Number)
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { toast } = useToast();

  // File Upload States
  const [images, setImages] = useState<File[]>([]);
  const [thumb, setThumb] = useState<File | null>(null);
  const [existingThumb, setExistingThumb] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [isSlugAuto, setIsSlugAuto] = useState(true);

  // Lock state to prevent race conditions during async data fetching
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // API Hooks
  const { data: productResponse, isLoading: isLoadingProduct } =
    useProduct(productId);
  const { mutate: updateProduct, isPending } = useUpdateProduct();
  const { data: categoryResponse, isLoading: isLoadingCats } = useCategories();

  const product = productResponse?.data;
  const allCategories = categoryResponse?.data || [];

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
      subCategoryId: "none",
      weight: "",
      dimensions: "",
      color: "",
      status: "ACTIVE",
      isPublished: true,
    },
  });

  const name = form.watch("name");
  const currentCategoryId = form.watch("categoryId");

  // ==========================================
  // 3. BULLETPROOF PRE-FILL LOGIC
  // ==========================================
  useEffect(() => {
    // 🚨 STRICT BLOCK: Do not run until BOTH APIs have completely finished loading
    if (isLoadingProduct || isLoadingCats) return;

    if (product && !isFormInitialized) {
      let rootId = "";
      let subId = "none"; // Default to "none" for Shadcn Select compatibility

      // Prisma returns full objects via `include: { categories: true }`
      if (Array.isArray(product.categories)) {
        const rootCat = product.categories.find(
          (c: any) => c.parentId === null,
        );
        const subCat = product.categories.find((c: any) => c.parentId !== null);

        if (rootCat) rootId = rootCat.id;
        if (subCat) subId = subCat.id;
      }

      form.reset({
        name: product.name || "",
        slug: product.slug || "",
        sku: product.sku || "",
        description: product.description || "",
        detailedDescription: product.detailedDescription || "",
        price: product.price || 0,
        discountedPrice: product.discountedPrice || undefined,
        inStock: product.inStock || 0,
        categoryId: rootId,
        subCategoryId: subId,
        weight: product.weight || "",
        dimensions: product.dimensions || "",
        color: product.color || "",
        status: product.status || "ACTIVE",
        isPublished: product.isPublished ?? true,
      });

      setExistingThumb(product.thumbImage || null);
      setExistingImages(product.imageArray || []);

      // Lock initialization so background refetches don't wipe out user inputs
      setIsFormInitialized(true);
    }
  }, [product, isLoadingProduct, isLoadingCats, isFormInitialized, form]);

  // ==========================================
  // 4. AUTO-SLUG GENERATION
  // ==========================================
  useEffect(() => {
    if (
      isFormInitialized &&
      name &&
      isSlugAuto &&
      product &&
      name !== product.name
    ) {
      form.setValue("slug", transliterate(name), { shouldValidate: true });
    }
  }, [name, isSlugAuto, isFormInitialized, product, form]);

  const { onChange: onSlugChange, ...slugFieldRest } = form.register("slug");

  // ==========================================
  // 5. FORM SUBMISSION
  // ==========================================
  const onSubmit = async (values: ProductFormOutput) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== "none") {
        formData.append(key, String(value));
      }
    });

    if (thumb) formData.append("thumbImage", thumb);
    images.forEach((img) => formData.append("imageArray", img));

    formData.append("existingImages", JSON.stringify(existingImages));

    updateProduct(
      { id: productId, data: formData },
      {
        onSuccess: () => {
          toast({
            title: "Успешно!",
            description: "Товар успешно обновлен.",
            variant: "success",
          });
          router.push("/products");
        },
        onError: (err: any) => {
          toast({
            title: "Ошибка при обновлении",
            description: err.response?.data?.message || err.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  // 🚨 CRITICAL LOADING CHECK
  if (isLoadingProduct || isLoadingCats || !isFormInitialized) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="text-sm text-muted-foreground animate-pulse">
          Загрузка данных товара...
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 pb-20 animate-in fade-in duration-500"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Редактировать товар
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
            Сохранить изменения
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Название товара <span className="text-red-500">*</span>
                </Label>
                <Input id="name" {...form.register("name")} />
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
                  />
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
                  <Input id="sku" {...form.register("sku")} />
                  {form.formState.errors.sku && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.sku.message}
                    </p>
                  )}
                </div>
              </div>

              {/* CATEGORIES WITH CONTROLLER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="grid gap-2">
                  <Label>
                    Главная категория <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("subCategoryId", "none"); // Reset subcategory when main changes
                        }}
                        value={field.value || undefined}
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-950">
                          <SelectValue placeholder="Выберите категорию" />
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
                    )}
                  />
                  {form.formState.errors.categoryId && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Подкатегория</Label>
                  <Controller
                    control={form.control}
                    name="subCategoryId"
                    render={({ field }) => (
                      <Select
                        disabled={!currentCategoryId}
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-950">
                          <SelectValue placeholder="Опционально" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            -- Нет подкатегории --
                          </SelectItem>
                          {allCategories
                            .filter((c) => c.parentId === currentCategoryId)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <CategoryManagerDialog />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>
                  Краткое описание <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  {...form.register("description")}
                  className="resize-none h-20"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Подробное описание</Label>
                <div className="border rounded-lg overflow-hidden min-h-[150px]">
                  <TiptapEditor
                    content={form.watch("detailedDescription") || ""}
                    onChange={(html) =>
                      form.setValue("detailedDescription", html)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MEDIA GALLERY */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Галерея медиа</CardTitle>
              <CardDescription>
                Загрузите новые изображения для замены существующих.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MAIN THUMBNAIL */}
                <div className="space-y-3">
                  <Label>Главное изображение (Миниатюра)</Label>
                  <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors relative min-h-[200px]">
                    {thumb || existingThumb ? (
                      <div className="relative w-full h-40">
                        <img
                          src={
                            thumb
                              ? URL.createObjectURL(thumb)
                              : getImageUrl(existingThumb)
                          }
                          className="w-full h-full object-contain rounded-md"
                          alt="Thumb"
                        />
                        {thumb && (
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
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Нет фото
                      </div>
                    )}
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setThumb(e.target.files?.[0] || null)}
                      accept="image/*"
                    />
                    {!thumb && (
                      <div className="absolute bottom-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Нажмите, чтобы заменить
                      </div>
                    )}
                  </div>
                </div>

                {/* GALLERY IMAGES */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Изображения галереи (Макс. 4)</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Combine existing images and newly uploaded files into one array for display */}
                    {[...existingImages, ...images]
                      .slice(0, 4)
                      .map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900"
                        >
                          <img
                            src={
                              typeof img === "string"
                                ? getImageUrl(img)
                                : URL.createObjectURL(img)
                            }
                            className="w-full h-full object-cover"
                            alt="gallery"
                          />
                          {/* Always show the delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (typeof img === "string") {
                                // Remove from existing images
                                setExistingImages((prev) =>
                                  prev.filter((url) => url !== img),
                                );
                              } else {
                                // Remove from newly uploaded files
                                setImages((prev) =>
                                  prev.filter((f) => f !== img),
                                );
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 transition-colors text-white rounded-md p-1 shadow"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                    {/* Upload new images button (hides if total is 4 or more) */}
                    {existingImages.length + images.length < 4 && (
                      <div className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <input
                          type="file"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            // Only add up to the remaining slots
                            const slotsLeft =
                              4 - (existingImages.length + images.length);
                            setImages((prev) =>
                              [...prev, ...files].slice(0, slotsLeft),
                            );
                          }}
                          accept="image/*"
                        />
                        <Upload size={24} className="text-slate-400 mb-2" />
                        <span className="text-[10px] text-slate-500 uppercase font-semibold text-center leading-tight">
                          Добавить
                          <br />
                          новые
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Статус и Цены</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/50">
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
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "ACTIVE"}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Активен</SelectItem>
                        <SelectItem value="OUT_OF_STOCK">
                          Нет в наличии
                        </SelectItem>
                        <SelectItem value="INACTIVE">Неактивен</SelectItem>
                        <SelectItem value="ARCHIVED">В архиве</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                  />
                </div>
              </div>

              <div className="grid gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label>
                  Остаток на складе (шт.){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input type="number" {...form.register("inStock")} />
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
                <Label className="text-xs">Вес</Label>
                <Input
                  {...form.register("weight")}
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Габариты (ДxШxВ)</Label>
                <Input
                  {...form.register("dimensions")}
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Цвет / Окрас</Label>
                <Input
                  {...form.register("color")}
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
