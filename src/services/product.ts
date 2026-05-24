"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/http/api-client";
import { ApiResponse } from "@/types/api";

// ==========================================
// 1. DOMAIN INTERFACES
// ==========================================
export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null; // Added SKU
  description: string;
  detailedDescription?: string | null;
  price: number;
  discountedPrice?: number | null;
  inStock: number;
  status: ProductStatus;
  isPublished: boolean;
  weight?: string | null;
  dimensions?: string | null;
  color?: string | null;
  categories: any[]; // Changed to any[] because admin/all returns string[], admin/:id returns objects
  tags: string[]; // Added tags array
  averageRating: number;
  reviewCount: number;
  thumbImage?: string | null;
  imageArray: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta: PaginationMeta;
}

// ==========================================
// 2. RAW API CALLS
// ==========================================
export const productApi = {
  /**
   * Fetch all products (Admin View - Paginated)
   */
  getAdminProducts: (
    params?: ProductQueryParams,
  ): Promise<PaginatedApiResponse<Product[]>> =>
    apiRequest({
      method: "GET",
      url: "/products/admin/all",
      params,
    }),

  /**
   * Fetch a single product by ID for the Edit Page
   */
  getProductById: (id: string): Promise<ApiResponse<Product>> =>
    apiRequest({
      method: "GET",
      url: `/products/admin/${id}`,
    }),

  /**
   * Create a new product (Requires FormData for MinIO Images)
   */
  createProduct: (data: FormData): Promise<ApiResponse<Product>> =>
    apiRequest({
      method: "POST",
      url: "/products/admin/create",
      data,
    }),

  /**
   * Update an existing product
   */
  updateProduct: ({
    id,
    data,
  }: {
    id: string;
    data: FormData;
  }): Promise<ApiResponse<Product>> =>
    apiRequest({
      method: "PUT",
      url: `/products/admin/${id}`,
      data,
    }),

  /**
   * Delete a product
   */
  deleteProduct: (id: string): Promise<ApiResponse<null>> =>
    apiRequest({
      method: "DELETE",
      url: `/products/admin/${id}`,
    }),

  /**
   * Update only the status (Active/Inactive) or Stock via Patch
   */
  updateProductStatus: (
    id: string,
    status: ProductStatus,
  ): Promise<ApiResponse<Product>> =>
    apiRequest({
      method: "PATCH",
      url: `/products/admin/${id}/status`,
      data: { status },
    }),
};

// ==========================================
// 3. REACT QUERY HOOKS (QUERIES)
// ==========================================

export const useAdminProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: ["admin", "products", params],
    queryFn: () => productApi.getAdminProducts(params),
  });
};

export const useProductById = (id: string) => {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => productApi.getProductById(id),
    enabled: !!id, // Only run if ID is valid
  });
};

// ==========================================
// 4. REACT QUERY HOOKS (MUTATIONS)
// ==========================================

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.updateProduct,
    onSuccess: (_, variables) => {
      // 1. Invalidate the admin product list cache
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

      // 2. CRITICAL: Invalidate the specific product's cache!
      queryClient.invalidateQueries({
        queryKey: ["admin", "product", variables.id],
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
};

export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      productApi.updateProductStatus(id, status),
    onSuccess: (_, variables) => {
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      // Invalidate the specific item being updated
      queryClient.invalidateQueries({
        queryKey: ["admin", "product", variables.id],
      });
    },
  });
};
