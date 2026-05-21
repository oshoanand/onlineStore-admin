import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { getSession } from "next-auth/react";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // REMOVED: headers: { "Content-Type": "application/json" }
  // Axios automatically sets Content-Type to application/json for objects,
  // and lets the browser set multipart/form-data with boundary for FormData.
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // We only want to fetch the session on the client side
    if (typeof window !== "undefined") {
      const session = await getSession();

      // Safely extract the token from session.user using Type Assertion
      const token = (session?.user as any)?.accessToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export class ApiError<T = unknown> extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: T,
    public validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError"; // Useful for debugging
  }
}

export const apiRequest = async <T, D = unknown>(
  config: AxiosRequestConfig<D>,
): Promise<T> => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Extract validation errors if they exist in your specific backend format
      const validationErrors = error.response?.data?.errors?.reduce(
        (
          acc: Record<string, string>,
          err: { path: string; message: string },
        ) => {
          if (err.path && err.message) {
            acc[err.path] = err.message;
          }
          return acc;
        },
        {},
      );

      throw new ApiError(
        error.response?.data?.message || error.message || "An error occurred",
        error.response?.status,
        error.response?.data,
        validationErrors,
      );
    }
    throw new ApiError("Unknown error occurred");
  }
};
