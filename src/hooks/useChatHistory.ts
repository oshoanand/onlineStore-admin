import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/http/api-client";

export interface ChatMessage {
  id: string;
  chatSessionId?: string;
  senderId: string;
  receiverId?: string;
  text?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;

  // --- UI & State Modifiers ---
  isOptimistic?: boolean;
  tempId?: string;
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
  };
}

export const useChatHistory = (userId: string, partnerId: string) => {
  return useInfiniteQuery<ChatMessage[]>({
    queryKey: ["chatHistory", partnerId],
    queryFn: async ({ pageParam }) => {
      try {
        // 🚨 FIX 1: URL MUST BE PLURAL "/api/chats/history" to match server.js
        const response = await apiRequest<any>({
          url: "/notifications/chat/history",
          method: "GET",
          params: {
            userId1: userId,
            userId2: partnerId,
            cursor: pageParam || undefined,
            limit: 20,
          },
        });

        // 🚨 FIX 2: Robustly extract the array regardless of backend structure
        const messages = Array.isArray(response)
          ? response
          : response?.messages || response?.data || response?.items || [];

        return messages;
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        return []; // Fail safely
      }
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => {
      // FIX 3: If the page is empty or less than the limit, we reached the end
      if (!lastPage || lastPage.length < 20) {
        return undefined;
      }

      // FIX 4: The cursor MUST be the OLDEST message in the current batch.
      // If the API returns newest-first, the oldest is at the end of the array.
      return lastPage[lastPage.length - 1]?.id;
    },
  });
};
