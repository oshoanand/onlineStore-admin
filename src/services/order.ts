import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./http/api-client";
import { Order, PaginatedResponse } from "@/types/order";

// 1. Get Paginated Orders for Admin
export const useAdminOrders = (
  page: number,
  limit: number,
  status?: string,
  search?: string,
) => {
  return useQuery({
    queryKey: ["admin-orders", page, limit, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status && status !== "ALL") params.append("status", status);
      if (search) params.append("search", search);

      const res = await apiRequest<PaginatedResponse<Order>>({
        method: "GET",
        url: `/orders/admin/all?${params.toString()}`,
      });
      return res;
    },
    placeholderData: (previousData) => previousData, // Keeps old data visible while fetching next page
  });
};

// 2. Get Single Order Details
export const useOrderDetails = (id: string) => {
  return useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      // NOTE: Ensure your backend allows admins to fetch orders without the userId check!
      const res = await apiRequest<{ data: Order }>({
        method: "GET",
        url: `/orders/${id}`,
      });
      return res.data;
    },
    enabled: !!id,
  });
};

// 3. Update Order Status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) =>
      apiRequest({
        method: "PATCH",
        url: `/orders/admin/${id}/status`,
        data: { status, notes },
      }),
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific order cache
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-order", variables.id],
      });
    },
  });
};
