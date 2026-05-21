"use client";

import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Globe,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import {
  useShippingZones,
  useDeleteShippingZone,
  ShippingZone,
} from "@/services/shipping";
import { ShippingZoneModal } from "./components/shipping-zone-modal";

export default function ShippingPage() {
  const { data: zones, isLoading } = useShippingZones();
  const deleteMutation = useDeleteShippingZone();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);

  const handleCreate = () => {
    setEditingZone(null);
    setIsModalOpen(true);
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, isDefault: boolean) => {
    if (isDefault) {
      return toast({
        title: "Ошибка",
        description: "Нельзя удалить зону по умолчанию.",
        variant: "destructive",
      });
    }
    if (confirm("Вы уверены, что хотите удалить эту зону доставки?")) {
      deleteMutation.mutate(id, {
        onSuccess: () =>
          toast({
            title: "Удалено",
            description: "Зона успешно удалена.",
            variant: "success",
          }),
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Зоны доставки</h1>
          <p className="text-muted-foreground mt-1">
            Управляйте регионами, стоимостью и бесплатной доставкой.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить зону
        </Button>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : zones?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <Globe className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium">Нет зон доставки</h3>
          <p className="text-muted-foreground mb-4">
            Создайте первую зону, чтобы рассчитывать стоимость для клиентов.
          </p>
          <Button onClick={handleCreate} variant="outline">
            Настроить сейчас
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {zones?.map((zone) => (
            <Card
              key={zone.id}
              className={`overflow-hidden transition-all hover:shadow-md ${zone.isDefault ? "border-blue-200 dark:border-blue-800" : ""}`}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center justify-between p-5 gap-4">
                  {/* Info Section */}
                  <div className="flex-1 min-w-0 flex items-start gap-4">
                    <div
                      className={`p-3 rounded-full shrink-0 ${zone.isDefault ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"}`}
                    >
                      {zone.isDefault ? (
                        <Globe className="h-6 w-6" />
                      ) : (
                        <MapPin className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold truncate">
                          {zone.name}
                        </h3>
                        {zone.isDefault && (
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            По умолчанию
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {zone.isDefault
                          ? "Применяется ко всем остальным регионам"
                          : `Городов: ${zone.cities?.length || 0}`}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="flex-1 flex flex-row items-center justify-between md:justify-end gap-8 w-full md:w-auto px-4 py-3 md:p-0 bg-slate-50 md:bg-transparent rounded-lg dark:bg-slate-900/50">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Стоимость
                      </p>
                      <p className="text-base font-bold">{zone.baseCost} ₽</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Бесплатно от
                      </p>
                      <p className="text-base font-bold text-green-600">
                        {zone.freeShippingThreshold
                          ? `${zone.freeShippingThreshold} ₽`
                          : "Нет"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 border-t md:border-none w-full md:w-auto pt-4 md:pt-0 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(zone)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" /> Изменить
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      onClick={() => handleDelete(zone.id, zone.isDefault)}
                      disabled={zone.isDefault || deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL */}
      <ShippingZoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingZone}
      />
    </div>
  );
}
