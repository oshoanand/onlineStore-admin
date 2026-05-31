import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "./useChatHistory";

export const useChatSocketSync = (
  socket: any,
  userId: string,
  partnerId: string,
) => {
  const queryClient = useQueryClient();
  const roomId = [userId, partnerId].sort().join("_");

  useEffect(() => {
    if (!socket || !userId) return;

    // ==========================================
    // 1. RECEIVE NEW MESSAGE
    // ==========================================
    const handleReceiveMessage = (incomingMsg: any) => {
      if (incomingMsg.roomId !== roomId) return;

      const newMessage: ChatMessage = {
        id: incomingMsg.id,
        roomId: incomingMsg.roomId,
        senderId: incomingMsg.senderId,
        text: incomingMsg.content,
        imageUrl: incomingMsg.fileUrl,
        isRead: incomingMsg.isRead,
        createdAt: incomingMsg.timestamp || incomingMsg.createdAt,
        tempId: incomingMsg.tempId,
      };

      queryClient.setQueryData(["chatHistory", partnerId], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          return { pages: [[newMessage]], pageParams: [""] };
        }

        const messageExists = oldData.pages.some((page: ChatMessage[]) =>
          page.some(
            (m) =>
              m.id === newMessage.id ||
              (m.tempId && m.tempId === newMessage.tempId),
          ),
        );
        if (messageExists) return oldData;

        const newPages = [...oldData.pages];

        if (newPages.length === 0) {
          newPages.push([newMessage]);
        } else {
          newPages[0] = [...newPages[0], newMessage];
        }

        return { ...oldData, pages: newPages };
      });

      if (newMessage.senderId === partnerId) {
        socket.emit("mark_messages_read", {
          messageIds: [newMessage.id],
          roomId,
        });
      }
    };

    // ==========================================
    // 2. CONFIRM SENT MESSAGE
    // ==========================================
    const handleMessageConfirmed = (confirmData: {
      tempId: string;
      message: any;
    }) => {
      queryClient.setQueryData(["chatHistory", partnerId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: ChatMessage[]) =>
            page.map((m) => {
              if (m.tempId === confirmData.tempId) {
                if (m.imageUrl && m.imageUrl.startsWith("blob:")) {
                  URL.revokeObjectURL(m.imageUrl);
                }
                return {
                  ...m,
                  id: confirmData.message.id,
                  isOptimistic: false,
                  text: confirmData.message.content || m.text,
                  imageUrl: confirmData.message.fileUrl || m.imageUrl,
                  createdAt: confirmData.message.createdAt || m.createdAt,
                };
              }
              return m;
            }),
          ),
        };
      });
    };

    // ==========================================
    // 3. MESSAGE DELETED
    // ==========================================
    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(["chatHistory", partnerId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: ChatMessage[]) =>
            page.filter((m) => m.id !== messageId),
          ),
        };
      });
    };

    // ==========================================
    // 4. MESSAGES READ
    // ==========================================
    const handleMessagesRead = ({
      messageIds,
      readBy,
    }: {
      messageIds: string[];
      readBy: string;
    }) => {
      if (readBy === partnerId) {
        queryClient.setQueryData(["chatHistory", partnerId], (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: ChatMessage[]) =>
              page.map((m) =>
                messageIds.includes(m.id) ? { ...m, isRead: true } : m,
              ),
            ),
          };
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_confirmed", handleMessageConfirmed);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_confirmed", handleMessageConfirmed);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [partnerId, roomId, socket, userId, queryClient]);
};
