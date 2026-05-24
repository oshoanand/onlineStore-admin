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
  // Public Tree (Cached, Fast)
  getPublicCategories: (): Promise<ApiResponse<Category[]>> =>
    apiRequest({ method: "GET", url: "/products/categories/public/tree" }),

  // Admin Flat List
  getAdminCategories: (): Promise<ApiResponse<Category[]>> =>
    apiRequest({ method: "GET", url: "/products/categories/admin/all" }),

  // Create
  createCategory: (data: FormData): Promise<ApiResponse<Category>> =>
    apiRequest({
      method: "POST",
      url: "/products/categories/admin/create",
      data,
    }),

  // Update
  updateCategory: ({
    id,
    data,
  }: {
    id: string;
    data: FormData;
  }): Promise<ApiResponse<Category>> =>
    apiRequest({
      method: "PUT",
      url: `/products/categories/admin/${id}`,
      data,
    }),

  // Delete
  deleteCategory: (id: string): Promise<ApiResponse<null>> =>
    apiRequest({ method: "DELETE", url: `/products/categories/admin/${id}` }),
};

// --- HOOKS ---

export const usePublicCategories = () => {
  return useQuery({
    queryKey: ["public-categories-tree"],
    queryFn: categoryApi.getPublicCategories,
  });
};

export const useAdminCategories = () => {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: categoryApi.getAdminCategories,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-categories-tree"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-categories-tree"] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-categories-tree"] });
    },
  });
};
