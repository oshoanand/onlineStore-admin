"use client";

import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { apiRequest } from "@/services/http/api-client";
import { useSession } from "next-auth/react";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

export default function FcmProvider() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only initialize FCM if the user is fully authenticated
    if (status !== "authenticated" || !session?.user) return;

    let unsubscribeOnMessage: (() => void) | undefined;

    const setupFcm = async () => {
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          const permission = await Notification.requestPermission();

          if (permission === "granted") {
            const msg = await messaging();
            if (!msg) return;

            // 1. Get Token
            const currentToken = await getToken(msg, { vapidKey: VAPID_KEY });

            if (currentToken) {
              // 2. Sync Token with Backend
              await apiRequest({
                method: "POST",
                url: "/users/fcm/save-fcm",
                data: { token: currentToken, mobile: session.user.mobile },
              });
              console.log("✅ FCM Token synced");
            }

            // 3. Foreground Listener (Memory Leak Fixed)
            unsubscribeOnMessage = onMessage(msg, (payload) => {
              console.log("🤫 FCM Foreground Message received:", payload);
              // 🚨 Intentionally NOT firing a Toast here.
              // Your RealTimeProvider (Socket.io) is already firing a Toast for this event!
              // Firebase will still handle background OS notifications automatically.
            });
          }
        }
      } catch (error) {
        console.error("FCM Setup Error:", error);
      }
    };

    setupFcm();

    // 4. CLEANUP FUNCTION: Unsubscribe when component unmounts
    return () => {
      if (unsubscribeOnMessage) {
        unsubscribeOnMessage();
      }
    };
  }, [session, status]);

  return null; // Silent Provider, renders nothing visually
}
