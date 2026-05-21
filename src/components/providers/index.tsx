"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import FcmProvider from "@/components/providers/FcmProvider";
import RealTimeProvider from "@/components/providers/RealTimeProvider";
import { NotificationProvider } from "./NotificationProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize QueryClient inside useState to ensure it's created once per request
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false, // Prevents spamming API
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {/* PWA & Real-Time Setup */}
        <ServiceWorkerRegister />
        <RealTimeProvider>
          <FcmProvider />
          <NotificationProvider>{children}</NotificationProvider>
        </RealTimeProvider>

        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
