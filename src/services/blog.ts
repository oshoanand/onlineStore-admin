"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/http/api-client";
import { ApiResponse } from "@/types/api";

// ==========================================
// 1. DOMAIN INTERFACES
// ==========================================
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  imageAltText?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  isActive: boolean;
  createdAt: string;
  author?: { name: string };
}

export interface Comment {
  id: string;
  content: string;
  status: string;
  user?: { name: string; email: string };
  article?: { title: string; slug: string };
}

// ==========================================
// 2. RAW API CALLS
// ==========================================
export const blogApi = {
  // Added /users prefix to all routes for API Gateway routing
  getAdminArticles: (): Promise<ApiResponse<Article[]>> =>
    apiRequest({ method: "GET", url: "/users/articles/admin/all" }),

  getPendingComments: (): Promise<ApiResponse<Comment[]>> =>
    apiRequest({
      method: "GET",
      url: "/users/articles/admin/comments?status=pending",
    }),

  createArticle: (
    data: Record<string, any> | FormData,
  ): Promise<ApiResponse<Article>> =>
    apiRequest({ method: "POST", url: "/users/articles/admin/create", data }),

  deleteArticle: (id: string): Promise<ApiResponse<null>> =>
    apiRequest({ method: "DELETE", url: `/users/articles/${id}` }),

  updateArticleStatus: (
    id: string,
    isActive: boolean,
  ): Promise<ApiResponse<Article>> =>
    apiRequest({
      method: "PATCH",
      url: `/users/articles/${id}/status`,
      data: { isActive },
    }),

  getArticleById: (id: string): Promise<ApiResponse<Article>> =>
    apiRequest({ method: "GET", url: `/users/articles/${id}` }),

  updateArticle: ({
    id,
    data,
  }: {
    id: string;
    data: FormData;
  }): Promise<ApiResponse<Article>> =>
    apiRequest({
      method: "PUT",
      url: `/users/articles/${id}`,
      data,
      // Axios automatically sets multipart/form-data headers when you pass FormData
    }),

  moderateComment: (
    commentId: string,
    status: "approved" | "rejected",
  ): Promise<ApiResponse<Comment>> =>
    apiRequest({
      method: "PATCH",
      url: `/users/articles/comments/${commentId}/moderate`,
      data: { status },
    }),
};

// ==========================================
// 3. REACT QUERY HOOKS (QUERIES)
// ==========================================

export const useAdminArticles = () => {
  return useQuery<ApiResponse<Article[]>>({
    queryKey: ["admin", "articles"],
    queryFn: blogApi.getAdminArticles,
  });
};

export const usePendingComments = () => {
  return useQuery<ApiResponse<Comment[]>>({
    queryKey: ["admin", "comments", "pending"],
    queryFn: blogApi.getPendingComments,
  });
};

export const useArticleById = (id: string) => {
  return useQuery<ApiResponse<Article>>({
    queryKey: ["admin", "article", id],
    queryFn: () => blogApi.getArticleById(id),
    enabled: !!id, // Only run the query if we have an ID
  });
};

// ==========================================
// 4. REACT QUERY HOOKS (MUTATIONS)
// ==========================================

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogApi.createArticle,
    onSuccess: () => {
      // Invalidate list so the new article appears immediately
      queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogApi.deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
    },
  });
};

export const useUpdateArticleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      blogApi.updateArticleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogApi.updateArticle,
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific article so the UI updates instantly
      queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "article", variables.id],
      });
    },
  });
};

export const useModerateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) => blogApi.moderateComment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "comments", "pending"],
      });
    },
  });
};
