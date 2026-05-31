"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/services/http/api-client";
import ChatDetailScreen from "@/components/chat/ChatDetailScreen";

export default function ChatRoomPage() {
  const { partnerId } = useParams() as { partnerId: string };
  const { status } = useSession();
  const router = useRouter();

  const [partnerName, setPartnerName] = useState<string>("Загрузка...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const fetchPartnerInfo = async () => {
      try {
        const data = await apiRequest<{ name?: string }>({
          method: "GET",
          url: `/users/${partnerId}`,
        });
        setPartnerName(data.name || "Пользователь");
      } catch (error) {
        console.error("Failed to fetch partner info:", error);
        setPartnerName("Пользователь");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartnerInfo();
  }, [status, partnerId, router]);

  const handleBack = () => {
    router.push("/chat");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
        <p className="text-muted-foreground font-medium">
          Подключение к чату...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] w-full overflow-hidden bg-background">
      <ChatDetailScreen
        partnerId={partnerId}
        partnerName={partnerName}
        onBack={handleBack}
      />
    </div>
  );
}
