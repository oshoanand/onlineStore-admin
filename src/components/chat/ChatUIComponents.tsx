import { useRef } from "react";
import {
  ChevronLeft,
  UserCircle,
  Check,
  CheckCheck,
  Loader2,
  Reply,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/hooks/useChatHistory";

// ==========================================
// 1. CHAT HEADER COMPONENT
// ==========================================
interface ChatHeaderProps {
  partnerName: string;
  partnerId: string;
  isOnline: boolean;
  lastSeen?: string;
  typingUser: string | null;
  onBack: () => void;
}

export const ChatHeader = ({
  partnerName,
  partnerId,
  isOnline,
  lastSeen,
  typingUser,
  onBack,
}: ChatHeaderProps) => (
  <header className="flex items-center gap-3 p-4 pt-safe border-b bg-white border-border/50 backdrop-blur-xl shrink-0 z-20 transition-colors">
    <button
      onClick={onBack}
      className="p-1.5 -ml-2 hover:bg-muted active:bg-muted/80 rounded-full transition-colors"
    >
      <ChevronLeft className="w-6 h-6 text-foreground" />
    </button>
    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <UserCircle className="w-6 h-6 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="font-bold text-[17px] text-foreground truncate leading-tight">
        {partnerName}
      </h2>
      {typingUser === partnerId ? (
        <p className="text-xs text-primary animate-pulse font-bold mt-0.5">
          печатает...
        </p>
      ) : isOnline ? (
        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />{" "}
          В сети
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
          Был(а){" "}
          {lastSeen
            ? formatDistanceToNow(new Date(lastSeen), {
                addSuffix: true,
                locale: ru,
              })
            : "недавно"}
        </p>
      )}
    </div>
  </header>
);

// ==========================================
// 2. CHAT BUBBLE COMPONENT (Gestures + Media)
// ==========================================
export const ChatBubble = ({
  msg,
  isMine,
  onSwipe,
  onLongPress,
}: {
  msg: ChatMessage;
  isMine: boolean;
  onSwipe: (msg: ChatMessage) => void;
  onLongPress: (pos: { x: number; y: number }, msg: ChatMessage) => void;
}) => {
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Long Press Logic ---
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    pressTimer.current = setTimeout(() => {
      if ("vibrate" in navigator) navigator.vibrate(50);
      onLongPress({ x: clientX, y: clientY }, msg);
    }, 500); // 500ms required to trigger context menu
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const hasImage = !!msg.imageUrl;
  const hasText = !!msg.text;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 100 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        // Trigger swipe-to-reply if pulled more than 60px right
        if (info.offset.x > 60) onSwipe(msg);
      }}
      className={clsx(
        "flex relative group",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {/* Hidden Swipe-to-Reply Icon */}
      <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 opacity-0 group-drag:opacity-100 transition-opacity">
        <div className="bg-muted p-2 rounded-full shadow-sm border border-border/50">
          <Reply className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div
        id={`msg-${msg.id}`}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd} // Cancel timer if user is just scrolling
        className={clsx(
          "max-w-[85%] rounded-3xl shadow-sm relative z-10 select-none flex flex-col",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card text-foreground border border-border/50 rounded-bl-sm",
          msg.isOptimistic && "opacity-70",
          hasImage && !hasText ? "p-1" : "px-4 py-2.5", // Tighter padding for image-only messages
        )}
      >
        {/* --- Reply Context Box --- */}
        {msg.replyTo && (
          <div
            className={clsx(
              "mb-2 p-2.5 rounded-2xl text-xs border-l-[3px] flex flex-col cursor-pointer transition-colors",
              isMine
                ? "bg-primary-foreground/10 border-primary-foreground/50 hover:bg-primary-foreground/20"
                : "bg-muted/50 border-primary hover:bg-muted",
            )}
          >
            <span className="font-bold mb-0.5 opacity-90">
              {msg.replyTo.senderId === msg.senderId ? "Вы" : "Ответ"}
            </span>
            <span className="opacity-80 truncate font-medium">
              {msg.replyTo.text || "📷 Фотография"}
            </span>
          </div>
        )}

        {/* --- Image Renderer --- */}
        {hasImage && (
          <div className="relative mb-1">
            <img
              src={msg.imageUrl!}
              alt="Вложение"
              className={clsx(
                "w-full max-h-[300px] object-cover",
                hasText ? "rounded-2xl" : "rounded-[1.3rem]",
              )}
            />
            {/* If no text, the timestamp lives directly on the image */}
            {!hasText && (
              <div className="absolute bottom-1.5 right-2 bg-black/40 text-white px-1.5 py-0.5 rounded-lg flex items-center gap-1 backdrop-blur-md">
                <span className="text-[10px] font-medium">
                  {format(new Date(msg.createdAt), "HH:mm")}
                </span>
                {isMine &&
                  !msg.isOptimistic &&
                  (msg.isRead ? (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white/80" />
                  ))}
                {isMine && msg.isOptimistic && (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-white/80" />
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Text & Timestamp Renderer --- */}
        {(hasText || (!hasImage && !hasText)) && (
          <div className="flex flex-col">
            {hasText && (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {msg.text}
              </p>
            )}

            <div
              className={clsx(
                "flex justify-end items-center gap-1 mt-1 text-[10px] font-medium",
                isMine ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
              {isMine &&
                !msg.isOptimistic &&
                (msg.isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                ))}
              {isMine && msg.isOptimistic && (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ==========================================
// 3. CHAT CONTEXT MENU COMPONENT
// ==========================================
export const ChatContextMenu = ({
  position,
  message,
  isMine,
  onClose,
  onReply,
  onDelete,
}: {
  position: { x: number; y: number };
  message: ChatMessage;
  isMine: boolean;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
}) => {
  // Math to keep the menu strictly inside the viewport bounds
  const safeY = Math.max(
    100,
    Math.min(
      position.y - 40,
      typeof window !== "undefined" ? window.innerHeight - 150 : 500,
    ),
  );
  const safeX = Math.max(
    10,
    Math.min(
      position.x - 60,
      typeof window !== "undefined" ? window.innerWidth - 160 : 300,
    ),
  );

  return (
    <AnimatePresence>
      {/* Invisible backdrop to capture outside clicks and close the menu */}
      <div
        className="fixed inset-0 z-[110] bg-black/5 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ top: safeY, left: safeX }}
        className="fixed z-[120] bg-background shadow-2xl rounded-2xl border border-border/50 py-1.5 min-w-[160px] overflow-hidden"
      >
        <button
          className="w-full px-4 py-3 text-left text-[15px] font-medium text-foreground hover:bg-muted active:bg-muted/80 flex items-center justify-between transition-colors border-b border-border/40"
          onClick={() => {
            onReply();
            onClose();
          }}
        >
          Ответить <Reply className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Only show delete option if the user sent the message */}
        {isMine && (
          <button
            className="w-full px-4 py-3 text-left text-[15px] font-bold text-destructive hover:bg-destructive/10 active:bg-destructive/20 flex items-center justify-between transition-colors"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            Удалить <Trash2 className="w-4 h-4 text-destructive/70" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
