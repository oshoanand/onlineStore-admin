import { create } from "zustand";
import { Socket } from "socket.io-client";

interface AppState {
  // Socket Connection
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;

  // Global Notification State (Bell Icon)
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  incrementUnread: () => void;

  // Chat Notification State (Chat Icon)
  unreadChatMessages: number;
  setUnreadChatMessages: (count: number) => void;
  incrementUnreadChat: () => void;

  // Global Presence State (Maps userId to boolean)
  onlineUsers: Record<string, boolean>;
  setOnlineUser: (userId: string, isOnline: boolean) => void;

  // Typing State (Maps roomId to boolean)
  typingRooms: Record<string, boolean>;
  setTypingStatus: (roomId: string, isTyping: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),

  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  incrementUnread: () =>
    set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),

  unreadChatMessages: 0,
  setUnreadChatMessages: (count) => set({ unreadChatMessages: count }),
  incrementUnreadChat: () =>
    set((state) => ({ unreadChatMessages: state.unreadChatMessages + 1 })),

  onlineUsers: {},
  setOnlineUser: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  typingRooms: {},
  setTypingStatus: (roomId, isTyping) =>
    set((state) => ({
      typingRooms: { ...state.typingRooms, [roomId]: isTyping },
    })),
}));
