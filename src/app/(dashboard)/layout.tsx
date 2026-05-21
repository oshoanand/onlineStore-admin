import * as React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import NotificationBell from "@/components/notification-bell";
import { UserNav } from "@/components/user-nav";
import { Search, ChevronRight } from "lucide-react";
import { Suspense } from "react";

// A clean fallback UI component for suspended page content
export const GlobalLoadingFallback = () => (
  <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  </div>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* ==========================================
          LEFT SIDE: Sidebar Area
      ========================================== */}
      <Sidebar collapsible="icon" className="bg-black ">
        <SidebarNav />
      </Sidebar>

      {/* ==========================================
          RIGHT SIDE: Content Area (Header + Main)
      ========================================== */}
      {/* UI UX FIX: Changed bg-white to bg-slate-50/50. 
        Professional dashboards use a slightly gray canvas so that white data cards stand out. 
      */}
      <SidebarInset className="flex flex-col flex-1 min-w-0 bg-slate-50/50 dark:bg-background transition-all">
        {/* HEADER */}
        {/* UI UX FIX: Enhanced backdrop blur, adjusted height, and refined borders for a "glass" effect */}
        <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between border-b border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-background/70 px-4 sm:px-6 backdrop-blur-xl transition-all">
          {/* Header Left: Trigger & Breadcrumbs */}
          <div className="flex items-center gap-3 lg:gap-4">
            <SidebarTrigger className="h-8 w-8 text-slate-500 hover:bg-transparent hover:text-orange-500 cursor-pointer" />

            <Separator
              orientation="vertical"
              className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"
            />

            {/* Contextual Breadcrumbs (Replaces plain text) */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors">
                Platform
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-slate-900 dark:text-slate-100 font-semibold tracking-tight">
                Dashboard
              </span>
            </div>
          </div>

          {/* Header Right: Global Search, Actions & User */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Global Search Bar (Modern Cmd+K style) */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-text w-64 group">
              <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
              <span className="text-sm text-slate-400 select-none flex-1">
                Search...
              </span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>

            <Separator
              orientation="vertical"
              className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"
            />

            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserNav />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        {/* UI UX FIX: Wrapped children in a max-width container to ensure content remains readable on ultra-wide monitors */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<GlobalLoadingFallback />}>
            <div className="mx-auto max-w-7xl w-full h-full">{children}</div>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
