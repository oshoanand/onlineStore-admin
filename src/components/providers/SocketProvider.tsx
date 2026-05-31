"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/useChatStore";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  const socket = useChatStore((state) => state.socket);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const disconnectSocket = useChatStore((state) => state.disconnectSocket);
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  const [isConnected, setIsConnected] = useState(false);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    const userId = session?.user?.id;

    // 🚨 FIX: Perfectly aligned with your auth.ts
    const token = (session as any)?.user?.accessToken;

    if (status === "authenticated" && userId && token) {
      if (!socket && !connectionAttempted.current) {
        connectionAttempted.current = true;
        connectSocket(userId, token);
      }
    } else if (status === "unauthenticated") {
      connectionAttempted.current = false;
      disconnectSocket();
    }
  }, [status, session, socket, connectSocket, disconnectSocket]);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers: new Set(Object.keys(onlineUsers || {})),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
