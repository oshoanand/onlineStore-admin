import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rocket } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Security Check
  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    // FIX 1: Removed hardcoded 100vh calc. Since this sits inside <main className="flex-1">
    // from your layout, it uses h-full and min-h-[70vh] to center perfectly without double scrollbars.
    <div className="flex h-full min-h-[70vh] w-full items-center justify-center">
      {/* FIX 2: Simplified backdrop-blur and opacity for Tailwind v4's native color-mix engine */}
      <Card className="w-full max-w-md border-slate-200/60 dark:border-slate-800 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-2 mt-4">
          {/* FIX 3: Used Tailwind v4 `size-` shorthand and upgraded the icon container UI */}
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner mb-2">
            <Rocket className="size-8 text-primary animate-pulse" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Coming Soon
            </CardTitle>
            <CardDescription className="text-base text-slate-500 dark:text-slate-400">
              We are currently building a new and improved analytics dashboard.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="text-center pb-8">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Our team is working hard to bring you detailed insights, real-time
            metrics, and comprehensive reports. Check back soon!
          </p>

          {/* FIX 4: Changed space-x-2 to gap-2 (modern flexbox standard) */}
          <div className="flex w-full max-w-sm items-center gap-2 mx-auto">
            <Input
              type="email"
              placeholder="Email for updates"
              disabled
              className="bg-slate-50/50 dark:bg-slate-800/50"
            />
            <Button type="submit" disabled className="shrink-0">
              Notify Me
            </Button>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-5 font-semibold uppercase tracking-widest">
            Estimated Launch: Q4 2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
