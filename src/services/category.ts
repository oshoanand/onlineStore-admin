"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/http/api-client";
import { ApiResponse } from "@/types/api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export const categoryApi = {
  getCategories: (): Promise<ApiResponse<Category[]>> =>
    apiRequest({ method: "GET", url: "/products/categories/admin/all" }),

  createCategory: (data: {
    name: string;
    parentId?: string | null;
  }): Promise<ApiResponse<Category>> =>
    apiRequest({
      method: "POST",
      url: "/products/categories/admin/create",
      data,
    }),

  updateCategory: ({
    id,
    data,
  }: {
    id: string;
    data: { name: string; parentId?: string | null };
  }): Promise<ApiResponse<Category>> =>
    apiRequest({
      method: "PUT",
      url: `/products/categories/admin/${id}`,
      data,
    }),

  deleteCategory: (id: string): Promise<ApiResponse<null>> =>
    apiRequest({ method: "DELETE", url: `/products/categories/admin/${id}` }),
};

// ==========================================
// ХУКИ REACT QUERY
// ==========================================
export const useCategories = () => {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoryApi.getCategories,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.updateCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
};
