import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/useChatStore";

export function ConnectionStatusBar() {
  const isSocketConnected = useChatStore((state) => state.isSocketConnected);
  const [showSuccess, setShowSuccess] = useState(false);

  // When we connect, show the "Connected" state for 2 seconds, then hide it
  useEffect(() => {
    if (isSocketConnected) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSocketConnected]);

  // If we are disconnected, we always want to show the warning/loading state
  const isVisible = !isSocketConnected || showSuccess;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute top-16 left-0 right-0 z-50 flex justify-center pointer-events-none"
        >
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full shadow-md backdrop-blur-md text-xs font-bold ${
              !isSocketConnected
                ? "bg-orange-500/90 text-white" // Warning State
                : "bg-emerald-500/90 text-white" // Success State
            }`}
          >
            {!isSocketConnected ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Соединение...
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                Подключено
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
