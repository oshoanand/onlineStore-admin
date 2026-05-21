import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/http/api-client";
import { ApiResponse } from "@/types/api";

export interface ShippingZone {
  id: string;
  name: string;
  cities: string[];
  isDefault: boolean;
  baseCost: string | number;
  freeShippingThreshold: string | number | null;
  createdAt: string;
  updatedAt: string;
}

// GET All Zones
export const useShippingZones = () => {
  return useQuery({
    queryKey: ["shipping-zones"],
    queryFn: async () => {
      // Adjust the URL prefix if your API gateway routes this differently (e.g., /products/shipping/admin/all)
      const res = await apiRequest<{ data: ShippingZone[] }>({
        method: "GET",
        url: "/products/shipping/admin/all",
      });
      return res.data;
    },
  });
};

// CREATE Zone
export const useCreateShippingZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShippingZone>) =>
      apiRequest({
        method: "POST",
        url: "/products/shipping/admin/create",
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });
};

// UPDATE Zone
export const useUpdateShippingZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShippingZone> }) =>
      apiRequest({
        method: "PUT",
        url: `/products/shipping/admin/${id}`,
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });
};

// DELETE Zone
export const useDeleteShippingZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest({ method: "DELETE", url: `/products/shipping/admin/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });
};
