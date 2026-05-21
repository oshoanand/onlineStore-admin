"use client";

import { useState } from "react";
import { CreatePlanDTO } from "@/data/use-subscription-plan"; // Ensure this type extends SubscriptionPlan
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

interface SubscriptionPlanFormProps {
  initialData?: any;
  onSubmit: (data: CreatePlanDTO) => void;
  isSubmitting: boolean;
}

export default function SubscriptionPlanForm({
  initialData,
  onSubmit,
  isSubmitting,
}: SubscriptionPlanFormProps) {
  const [formData, setFormData] = useState<CreatePlanDTO>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    tier: initialData?.tier || "FREE",
    // Prices
    priceMonthly: initialData?.priceMonthly || 0,
    priceHalfYearly: initialData?.priceHalfYearly || 0,
    priceYearly: initialData?.priceYearly || 0,

    features: initialData?.features || [],
    isActive: initialData?.isActive ?? true,
  });

  const [newFeature, setNewFeature] = useState("");

  const handleChange = (field: keyof CreatePlanDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Basic Info & Pricing */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Название тарифа</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Например: Премиум"
              />
            </div>

            <div className="grid gap-2">
              <Label>Уровень (Tier)</Label>
              <Select
                value={formData.tier}
                onValueChange={(val) => handleChange("tier", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Бесплатный</SelectItem>
                  <SelectItem value="STANDARD">Стандарт</SelectItem>
                  <SelectItem value="PREMIUM">Премиум</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Краткое описание преимуществ..."
              />
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
              <Checkbox
                id="active"
                checked={formData.isActive}
                onCheckedChange={(c) => handleChange("isActive", c as boolean)}
              />
              <Label htmlFor="active" className="cursor-pointer font-medium">
                Активный план (виден пользователям)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* --- PRICING SECTION --- */}
        <Card>
          <CardHeader>
            <CardTitle>Настройка цен (в рублях)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Цена за 1 месяц</Label>
              <Input
                type="number"
                min="0"
                value={formData.priceMonthly}
                onChange={(e) => handleChange("priceMonthly", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Цена за 6 месяцев</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.priceHalfYearly || ""}
                  onChange={(e) =>
                    handleChange("priceHalfYearly", e.target.value)
                  }
                  placeholder="Необязательно"
                />
                <p className="text-[10px] text-muted-foreground">
                  Оставьте пустым, если нет опции
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Цена за 1 год</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.priceYearly || ""}
                  onChange={(e) => handleChange("priceYearly", e.target.value)}
                  placeholder="Необязательно"
                />
                <p className="text-[10px] text-muted-foreground">
                  Оставьте пустым, если нет опции
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Features List */}
      <div className="space-y-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Список возможностей</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Добавить новую возможность..."
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addFeature())
                }
              />
              <Button type="button" onClick={addFeature} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2">
              {formData.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-md text-sm group"
                >
                  <span>{feature}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.features.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                  Список возможностей пуст
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 text-lg font-semibold"
          size="lg"
          disabled={isSubmitting}
          onClick={() => onSubmit(formData)}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Сохранить тариф
        </Button>
      </div>
    </div>
  );
}
