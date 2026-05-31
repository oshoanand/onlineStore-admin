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
  Tags,
  Plus,
  ExternalLink,
  CornerDownRight,
  ShoppingCart, // 🚨 NEW: Imported for the marketplace card
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
import { Badge } from "@/components/ui/badge";
import TiptapEditor from "@/components/tiptap-editor";
import { useToast } from "@/hooks/use-toast";

import { useProductById, useUpdateProduct } from "@/services/product";
import { useAdminCategories } from "@/services/category";
import { getImageUrl } from "@/utils/image";

// ==========================================
// 1. TRANSLITERATION FUNCTION (RU -> EN)
// ==========================================
export const transliterate = (text: string) => {
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

  tags: z.array(z.string()).default([]),

  // 🚨 NEW: Marketplace Links Validation (Optional URLs)
  avitoLink: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
  yandexmarketLink: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
  ozonLink: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
  wildberriesLink: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
  amazonLink: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;

const PRESET_TAGS = [
  "Хит продаж",
  "Новинка",
  "Скидка",
  "Рекомендуем",
  "Эксклюзив",
];

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

  const [isSlugAuto, setIsSlugAuto] = useState(false); // Usually false on Edit
  const [tagInput, setTagInput] = useState("");

  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // API Hooks
  const { data: productResponse, isLoading: isLoadingProduct } =
    useProductById(productId);
  const { mutate: updateProduct, isPending } = useUpdateProduct();
  const { data: categoryResponse, isLoading: isLoadingCats } =
    useAdminCategories();

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
      tags: [],
      // 🚨 NEW: Marketplace Links Defaults
      avitoLink: "",
      yandexmarketLink: "",
      ozonLink: "",
      wildberriesLink: "",
      amazonLink: "",
    },
  });

  const name = form.watch("name");
  const currentTags = form.watch("tags") || [];

  // ==========================================
  // 3. INTELLIGENT PRE-FILL & PATH TRACING
  // ==========================================
  useEffect(() => {
    if (isLoadingProduct || isLoadingCats || !allCategories.length) return;

    if (product && !isFormInitialized) {
      let reconstructedPath: string[] = [];

      if (Array.isArray(product.categories) && product.categories.length > 0) {
        let leafCat = product.categories.find(
          (c: any) =>
            !product.categories.some((other: any) => other.parentId === c.id),
        );
        if (!leafCat) leafCat = product.categories[0];

        let currentId = leafCat?.id;
        while (currentId) {
          reconstructedPath.unshift(currentId);
          const catObj = allCategories.find((c: any) => c.id === currentId);
          currentId = catObj?.parentId || null;
        }

        setCategoryPath(reconstructedPath);
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
        categoryId: reconstructedPath[0] || "",
        subCategoryId:
          reconstructedPath.length > 1
            ? reconstructedPath[reconstructedPath.length - 1]
            : "none",
        weight: product.weight || "",
        dimensions: product.dimensions || "",
        color: product.color || "",
        status: product.status || "ACTIVE",
        isPublished: product.isPublished ?? true,
        tags: product.tags || [],

        // 🚨 NEW: Map existing links from backend to form
        avitoLink: product.avitoLink || "",
        yandexmarketLink: product.yandexmarketLink || "",
        ozonLink: product.ozonLink || "",
        wildberriesLink: product.wildberriesLink || "",
        amazonLink: product.amazonLink || "",
      });

      setExistingThumb(product.thumbImage || null);
      setExistingImages(product.imageArray || []);
      setIsFormInitialized(true);
    }
  }, [
    product,
    isLoadingProduct,
    isLoadingCats,
    allCategories,
    isFormInitialized,
    form,
  ]);

  // ==========================================
  // 4. AUTO-SLUG & DEEP CASCADING LOGIC
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

  const cascadingLevels = [];
  let currentParentId: string | null = null;

  for (let i = 0; i <= categoryPath.length; i++) {
    const options = allCategories.filter(
      (c: any) => c.parentId === currentParentId,
    );
    if (options.length === 0) break;

    cascadingLevels.push({
      level: i,
      options,
      selectedValue: categoryPath[i] || "none",
    });

    currentParentId = categoryPath[i];
    if (!currentParentId || currentParentId === "none") break;
  }

  const handleCategoryChange = (level: number, val: string) => {
    let newPath;
    if (val === "none") {
      newPath = categoryPath.slice(0, level);
    } else {
      newPath = [...categoryPath.slice(0, level), val];
    }
    setCategoryPath(newPath);

    form.setValue("categoryId", newPath[0] || "", { shouldValidate: true });
    form.setValue(
      "subCategoryId",
      newPath.length > 1 ? newPath[newPath.length - 1] : "none",
    );
  };

  // ==========================================
  // 5. TAGS & FORM SUBMISSION
  // ==========================================
  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (cleanTag && !currentTags.includes(cleanTag)) {
      form.setValue("tags", [...currentTags, cleanTag], {
        shouldValidate: true,
      });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      currentTags.filter((t) => t !== tagToRemove),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (values: ProductFormOutput) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      // Allow empty strings to be passed so the backend can clear deleted links
      if (value !== undefined && value !== "none") {
        if (key === "tags") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
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
      className="space-y-8 pb-20 animate-in fade-in duration-500 relative"
    >
      {/* STICKY TOOLBAR */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-4 mb-6 border-b border-slate-200 dark:border-slate-800 shadow-sm -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            type="button"
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Редактировать товар
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="hidden sm:inline-flex"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="shadow-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Сохранить изменения</span>
            <span className="sm:hidden">Сохранить</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 px-1">
        {/* ==========================================
            LEFT COLUMN (Main Specs)
        ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg">Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Название товара <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  className={`transition-all ${form.formState.errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 font-medium">
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Можно редактировать вручную
                  </p>
                  {form.formState.errors.slug && (
                    <p className="text-xs text-red-500 font-medium">
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
                    <p className="text-xs text-red-500 font-medium">
                      {form.formState.errors.sku.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 relative space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">
                    Категория <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    variant="link"
                    size="sm"
                    type="button"
                    className="text-blue-600 hover:text-blue-800 h-auto p-0 font-medium"
                    onClick={() => router.push("/categories")}
                  >
                    Настройки <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {cascadingLevels.map((levelData) => (
                    <div
                      key={levelData.level}
                      className="relative flex items-center"
                    >
                      {levelData.level > 0 && (
                        <CornerDownRight className="h-4 w-4 text-slate-400 mr-2 shrink-0 opacity-70" />
                      )}
                      <div className="flex-1">
                        <Select
                          value={levelData.selectedValue}
                          onValueChange={(val) =>
                            handleCategoryChange(levelData.level, val)
                          }
                        >
                          <SelectTrigger
                            className={`bg-white dark:bg-slate-950 shadow-sm ${levelData.level === 0 && form.formState.errors.categoryId ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
                          >
                            <SelectValue
                              placeholder={
                                levelData.level === 0
                                  ? "Выберите главную категорию"
                                  : "Выберите подкатегорию (необязательно)"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {levelData.level > 0 && (
                              <SelectItem
                                value="none"
                                className="text-slate-400 italic"
                              >
                                -- Остановиться на этом уровне --
                              </SelectItem>
                            )}
                            {levelData.options.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  {form.formState.errors.categoryId && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
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
                  <p className="text-xs text-red-500 font-medium">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Подробное описание (Rich Text)</Label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden min-h-[200px]">
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
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg">Галерея медиа</CardTitle>
              <CardDescription>
                Загрузите новые изображения для замены существующих.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Главное изображение (Миниатюра)</Label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors relative min-h-[200px]">
                    {thumb || existingThumb ? (
                      <div className="relative w-full h-40">
                        <img
                          src={
                            thumb
                              ? URL.createObjectURL(thumb)
                              : getImageUrl(existingThumb!)
                          }
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
                            setExistingThumb(null);
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
                    {[...existingImages, ...images]
                      .slice(0, 4)
                      .map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900"
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (typeof img === "string") {
                                setExistingImages((prev) =>
                                  prev.filter((url) => url !== img),
                                );
                              } else {
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

                    {existingImages.length + images.length < 4 && (
                      <div className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <input
                          type="file"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
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

        {/* ==========================================
            RIGHT COLUMN (Tags, Pricing, Meta)
        ========================================== */}
        <div className="space-y-6">
          {/* STATUS & PRICING */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-base">Статус и Цены</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Опубликовано</Label>
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
                    placeholder="0.00"
                  />
                  {form.formState.errors.price && (
                    <p className="text-xs text-red-500 font-medium">
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

              <div className="grid gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  <p className="text-xs text-red-500 font-medium">
                    {form.formState.errors.inStock.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 🚨 NEW: MARKETPLACE LINKS */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                Ссылки на маркетплейсы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-2">
                <Label className="text-xs">Яндекс Маркет</Label>
                <Input
                  {...form.register("yandexmarketLink")}
                  placeholder="https://market.yandex.ru/..."
                />
                {form.formState.errors.yandexmarketLink && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.yandexmarketLink.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Ozon</Label>
                <Input
                  {...form.register("ozonLink")}
                  placeholder="https://ozon.ru/..."
                />
                {form.formState.errors.ozonLink && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.ozonLink.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Wildberries</Label>
                <Input
                  {...form.register("wildberriesLink")}
                  placeholder="https://wildberries.ru/..."
                />
                {form.formState.errors.wildberriesLink && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.wildberriesLink.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Avito</Label>
                <Input
                  {...form.register("avitoLink")}
                  placeholder="https://avito.ru/..."
                />
                {form.formState.errors.avitoLink && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.avitoLink.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Amazon</Label>
                <Input
                  {...form.register("amazonLink")}
                  placeholder="https://amazon.com/..."
                />
                {form.formState.errors.amazonLink && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.amazonLink.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TAGS MANAGEMENT */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Tags className="h-4 w-4 text-blue-600" />
                Теги (Группы на главной)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map((tag) => {
                  const isSelected = currentTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all border-slate-200 dark:border-slate-700 ${isSelected ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      onClick={() =>
                        isSelected ? handleRemoveTag(tag) : handleAddTag(tag)
                      }
                    >
                      {tag}{" "}
                      {isSelected ? (
                        <X className="ml-1 h-3 w-3" />
                      ) : (
                        <Plus className="ml-1 h-3 w-3 text-slate-400" />
                      )}
                    </Badge>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Свой тег..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleAddTag(tagInput)}
                >
                  Добавить
                </Button>
              </div>

              {currentTags.filter((t) => !PRESET_TAGS.includes(t)).length >
                0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500 w-full mb-1 font-medium">
                    Свои теги:
                  </span>
                  {currentTags
                    .filter((t) => !PRESET_TAGS.includes(t))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-slate-700 hover:bg-slate-800 text-white pr-1.5 flex items-center gap-1 transition-colors"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="rounded-full hover:bg-slate-500 p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CHARACTERISTICS */}
          <Card className="border border-indigo-100 dark:border-indigo-900/30 shadow-sm bg-indigo-50/30 dark:bg-indigo-900/10 overflow-hidden">
            <CardHeader className="pb-3 bg-indigo-50/80 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30">
              <CardTitle className="text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-bold">
                Характеристики
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Вес
                </Label>
                <Input
                  {...form.register("weight")}
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Габариты (ДxШxВ)
                </Label>
                <Input
                  {...form.register("dimensions")}
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Цвет / Окрас
                </Label>
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
