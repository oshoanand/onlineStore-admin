"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  useCreateShippingZone,
  useUpdateShippingZone,
  ShippingZone,
} from "@/services/shipping";
const schema = z.object({
  name: z.string().min(2, "Название обязательно"),
  baseCost: z
    .union([z.string(), z.number()])
    .transform(Number)
    .refine((val) => val >= 0, "Не может быть отрицательным"),
  freeShippingThreshold: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? null : Number(val))),
  isDefault: z.boolean().default(false),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ShippingZone | null;
}
export function ShippingZoneModal({ isOpen, onClose, initialData }: Props) {
  const { toast } = useToast();
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");

  const createMutation = useCreateShippingZone();
  const updateMutation = useUpdateShippingZone();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // 3. 🚨 Apply the separated types to useForm
  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      baseCost: 0,
      freeShippingThreshold: undefined,
      isDefault: false,
    },
  });

  // Pre-fill data for Edit Mode
  useEffect(() => {
    if (initialData && isOpen) {
      form.reset({
        name: initialData.name,
        // Safely pass the API data (which might be strings)
        baseCost: initialData.baseCost,
        freeShippingThreshold: initialData.freeShippingThreshold || undefined,
        isDefault: initialData.isDefault,
      });
      setCities(initialData.cities || []);
    } else if (isOpen) {
      form.reset({
        name: "",
        baseCost: 0,
        freeShippingThreshold: undefined,
        isDefault: false,
      });
      setCities([]);
    }
  }, [initialData, isOpen, form]);

  // Handle City Tags (Enter or Comma)
  const handleCityKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newCity = cityInput.trim().toLowerCase();
      if (newCity && !cities.includes(newCity)) {
        setCities([...cities, newCity]);
      }
      setCityInput("");
    }
  };

  const removeCity = (cityToRemove: string) => {
    setCities(cities.filter((c) => c !== cityToRemove));
  };

  // 4. 🚨 Tell onSubmit to expect the transformed FormOutput
  const onSubmit = (values: FormOutput) => {
    const payload = { ...values, cities };

    if (initialData) {
      updateMutation.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            toast({
              title: "Успешно",
              description: "Зона доставки обновлена",
              variant: "success",
            });
            onClose();
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
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast({
            title: "Успешно",
            description: "Новая зона доставки создана",
            variant: "success",
          });
          onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Редактировать зону" : "Создать зону доставки"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Название зоны <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Например: Москва и МО"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Города (введите и нажмите Enter)</Label>
            <Input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleCityKeyDown}
              placeholder="Введите город..."
              disabled={form.watch("isDefault")}
            />
            {form.watch("isDefault") && (
              <p className="text-xs text-muted-foreground">
                Для зоны по умолчанию города указывать не нужно.
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {cities.map((city) => (
                <Badge
                  key={city}
                  variant="secondary"
                  className="px-2 py-1 flex items-center gap-1"
                >
                  {city}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeCity(city)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Базовая стоимость (₽) <span className="text-red-500">*</span>
              </Label>
              <Input type="number" step="0.01" {...form.register("baseCost")} />
            </div>
            <div className="space-y-2">
              <Label>Бесплатно от (₽)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Пусто = никогда"
                {...form.register("freeShippingThreshold")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="space-y-0.5">
              <Label>Зона по умолчанию</Label>
              <p className="text-xs text-muted-foreground">
                Применяется, если город не найден
              </p>
            </div>
            <Controller
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
