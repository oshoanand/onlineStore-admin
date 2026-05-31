"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/http/api-client";
import { ApiResponse } from "@/types/api";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  status: CustomerStatus;
  createdAt: string;
  profilePhoto: string | null;
  totalOrders: number;
  isOnline: boolean;
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface UpdateCustomerStatusPayload {
  id: string;
  status: CustomerStatus | string;
}

// ==========================================
// 2. RAW API CALLS
// ==========================================

/**
 * Fetch paginated customers from the User Service
 */
const getCustomersList = async (
  params?: GetCustomersParams,
): Promise<ApiResponse<Customer[]>> => {
  // Build query string cleanly
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  if (params?.status && params.status !== "ALL")
    searchParams.append("status", params.status);
  if (params?.search) searchParams.append("search", params.search);

  const queryString = searchParams.toString();
  const url = `/users/admin/customers${queryString ? `?${queryString}` : ""}`;

  const response = await apiRequest<ApiResponse<Customer[]>>({
    method: "GET",
    url,
  });

  return response; // Returns { data, success, meta }
};

/**
 * Update a specific customer's status
 */
const updateCustomerStatus = async ({
  id,
  status,
}: UpdateCustomerStatusPayload) => {
  return await apiRequest({
    method: "PUT",
    url: `/users/admin/customers/${id}/status`,
    data: { status },
  });
};

// ==========================================
// 3. REACT QUERY HOOKS
// ==========================================

/**
 * Hook to fetch and cache the paginated list of customers.
 */
export function useAdminCustomersQuery(params?: GetCustomersParams) {
  return useQuery({
    // Include params in the query key so it refetches automatically when page/filters change
    queryKey: ["admin-customers", params],
    queryFn: () => getCustomersList(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    // Smooth UI: keep old data visible while fetching the next page
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to update a customer's status.
 */
export function useUpdateCustomerStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCustomerStatus,
    onSuccess: () => {
      // Instantly invalidate to refetch the current list
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });
}
