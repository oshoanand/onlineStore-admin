export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
}
