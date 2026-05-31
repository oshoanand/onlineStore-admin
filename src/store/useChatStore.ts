import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { apiRequest } from "@/services/http/api-client";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
export interface ChatState {
  // Connection State
  socket: Socket | null;
  isSocketConnected: boolean;

  // Notification State
  totalUnreadCount: number;
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;

  // Presence & Active View State
  onlineUsers: Record<string, boolean>;
  lastSeenMap: Record<string, string>;
  activeChatId: string | null;
  typingUser: string | null;

  // React Query Trigger
  refreshTrigger: number;

  // Actions
  connectSocket: (userId: string, token: string) => void; // 🚨 Now strictly requires the JWT token
  disconnectSocket: () => void;
  syncUnreadCount: () => Promise<void>;
  setOnlineStatusBulk: (
    onlineIds: string[],
    lastSeenData: Record<string, string>,
  ) => void;
  setActiveChat: (partnerId: string | null) => void;
  decreaseUnreadCount: (amount: number) => void;
}

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
const playNotificationSound = () => {
  if (typeof window !== "undefined") {
    const audio = new Audio("/sounds/notification.wav");
    audio.play().catch((err) => {
      console.warn("Audio playback blocked by browser policy:", err);
    });
  }
};

// ==========================================
// 3. ZUSTAND STORE IMPLEMENTATION
// ==========================================
export const useChatStore = create<ChatState>((set, get) => ({
  // Initial State
  socket: null,
  isSocketConnected: false,
  totalUnreadCount: 0,
  onlineUsers: {},
  lastSeenMap: {},
  activeChatId: null,
  refreshTrigger: 0,
  typingUser: null,
  unreadNotifications: 0,

  setUnreadNotifications: (count) => set({ unreadNotifications: count }),

  // ----------------------------------------------------
  // SOCKET CONNECTION & LIFECYCLE
  // ----------------------------------------------------
  connectSocket: (userId: string, token: string) => {
    const currentSocket = get().socket;

    // Prevent duplicate connections
    if (currentSocket?.connected) {
      set({ isSocketConnected: true });
      return;
    }

    if (currentSocket && !currentSocket.connected) {
      currentSocket.connect();
      return;
    }

    // Safely extract the Base URL to point to the API Gateway
    const rawUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
    const gatewayUrl = new URL(rawUrl).origin;

    // 🚨 SECURE FAST CONNECTION CONFIGURATION
    const socket = io(gatewayUrl, {
      path: "/api/notifications/socket.io",
      transports: ["websocket"], // Skips HTTP polling for instant TCP upgrade
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { token }, // 🚨 Pass the JWT token for Backend Validation
    });

    // Catch hyper-fast connections
    if (socket.connected) {
      set({ isSocketConnected: true });
      get().syncUnreadCount();
    }

    // --- CONNECTION LIFECYCLE EVENTS ---
    socket.on("connect", () => {
      console.log("✅ Socket Connected via Secure Handshake");
      set({ isSocketConnected: true });
      get().syncUnreadCount();
    });

    socket.on("disconnect", () => {
      set({ isSocketConnected: false });
    });

    socket.on("connect_error", (error) => {
      console.error("🚨 Socket Connection Error:", error.message);
      // If the error is an authentication error (e.g., token expired),
      // you could potentially trigger a NextAuth token refresh here.
      set({ isSocketConnected: false });
    });

    // --- DATA SYNC EVENTS ---
    socket.on("online_users_list", (onlineArray: string[]) => {
      const onlineMap: Record<string, boolean> = {};
      onlineArray.forEach((id) => {
        onlineMap[id] = true;
      });
      set({ onlineUsers: onlineMap });
    });

    socket.on("receive_message", (newMessage) => {
      // If we are NOT currently chatting with the sender, bump the unread badge
      if (get().activeChatId !== newMessage.senderId) {
        get().syncUnreadCount();
        playNotificationSound();
        if ("vibrate" in navigator) navigator.vibrate([200]);
      }
      // Always trigger refresh so ChatHistory updates
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("message_confirmed", () => {
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("messages_read_by_recipient", () => {
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("read_status_synced", () => {
      get().syncUnreadCount();
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("message_deleted", () => {
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    // --- PRESENCE EVENTS (Optimized for React rendering) ---
    socket.on(
      "user_status_changed",
      ({ userId: changedUserId, isOnline, lastSeen }) => {
        set((state) => {
          // Performance check: don't clone object if state hasn't actually changed
          if (isOnline && state.onlineUsers[changedUserId]) return state;
          if (
            !isOnline &&
            !state.onlineUsers[changedUserId] &&
            state.lastSeenMap[changedUserId] === lastSeen
          )
            return state;

          const newOnlineUsers = { ...state.onlineUsers };
          const newLastSeenMap = { ...state.lastSeenMap };

          if (isOnline) {
            newOnlineUsers[changedUserId] = true;
            delete newLastSeenMap[changedUserId];
          } else {
            delete newOnlineUsers[changedUserId];
            if (lastSeen) {
              newLastSeenMap[changedUserId] = lastSeen;
            }
          }

          return { onlineUsers: newOnlineUsers, lastSeenMap: newLastSeenMap };
        });
      },
    );

    // --- TYPING INDICATOR EVENTS ---
    socket.on("user_typing", ({ senderId }) => {
      if (get().activeChatId === senderId) {
        set({ typingUser: senderId });
      }
    });

    socket.on("user_stopped_typing", () => {
      set({ typingUser: null });
    });

    // Commit socket to state
    set({ socket, isSocketConnected: socket.connected });
  },

  // ----------------------------------------------------
  // SOCKET DISCONNECTION & CLEANUP
  // ----------------------------------------------------
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    // Wipe sensitive state on logout
    set({
      socket: null,
      isSocketConnected: false,
      totalUnreadCount: 0,
      onlineUsers: {},
      lastSeenMap: {},
      typingUser: null,
      activeChatId: null,
    });
  },

  // ----------------------------------------------------
  // STATE MANAGEMENT ACTIONS
  // ----------------------------------------------------
  setOnlineStatusBulk: (
    onlineIds: string[],
    lastSeenData: Record<string, string>,
  ) => {
    const onlineMap: Record<string, boolean> = {};
    onlineIds.forEach((id) => {
      onlineMap[id] = true;
    });
    set({
      onlineUsers: onlineMap,
      lastSeenMap: lastSeenData,
    });
  },

  syncUnreadCount: async () => {
    try {
      const data = await apiRequest<{ totalUnread?: number; count?: number }>({
        method: "GET",
        url: "/notifications/chat/unread-count",
      });
      set({ totalUnreadCount: data.totalUnread || data.count || 0 });
    } catch (error) {
      console.error("❌ Error syncing unread count:", error);
    }
  },

  setActiveChat: (partnerId: string | null) => {
    if (get().activeChatId === partnerId) return;
    set({ activeChatId: partnerId, typingUser: null });
  },

  decreaseUnreadCount: (amount: number) => {
    set((state) => ({
      totalUnreadCount: Math.max(0, state.totalUnreadCount - amount),
    }));
  },
}));
