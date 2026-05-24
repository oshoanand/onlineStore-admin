"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BellRing,
  Command,
  Headset,
  CreditCard,
  Users,
  Ticket,
  Layers,
  Package,
  ShoppingCart,
  Truck,
  Tag,
  FileText,
} from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Grouped logically but without labels for a compact, elegant layout
  const menuGroups = [
    {
      items: [
        {
          href: "/dashboard",
          icon: LayoutDashboard,
          label: "Дашборд",
        },
      ],
    },
    ...(userRole === "ADMINISTRATOR"
      ? [
          {
            items: [
              {
                href: "/users/manage",
                icon: Users,
                label: "Пользователи",
              },
              {
                href: "/customers",
                icon: Ticket,
                label: "Клиенты",
              },
            ],
          },
        ]
      : []),
    {
      items: [
        { href: "/categories", icon: Layers, label: "Категории" },
        { href: "/products", icon: Package, label: "Товары" },
        { href: "/orders", icon: ShoppingCart, label: "Заказы" },
        { href: "/payments", icon: CreditCard, label: "Платежи" },
      ],
    },
    {
      items: [
        { href: "/shipping", icon: Truck, label: "Доставка" },
        { href: "/promocode", icon: Tag, label: "Промокоды" },
      ],
    },
    {
      items: [
        { href: "/blog", icon: FileText, label: "Блог" },
        { href: "/support", icon: Headset, label: "Поддержка" },
        { href: "/notifications", icon: BellRing, label: "Уведомления" },
      ],
    },
  ];

  return (
    <>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-white/5 focus:bg-transparent active:bg-transparent group-data-[collapsible=icon]:justify-center rounded-xl"
            >
              <Link href="/dashboard" className="gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <Command className="size-4.5" strokeWidth={2.5} />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden transition-opacity">
                  <span className="truncate text-sm font-bold tracking-wider text-white uppercase">
                    Shop Admin
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pb-4 px-2 gap-0">
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup
            key={groupIndex}
            // className={`px-0 py-1.5 ${groupIndex !== 0 ? "border-t border-white/10 mt-1.5" : ""}`}
          >
            <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:px-0">
              {group.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={`h-9 group flex items-center transition-all duration-200 group-data-[collapsible=icon]:justify-center rounded-lg ${
                        isActive
                          ? "bg-orange-500/15 hover:bg-orange-500/20"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                      >
                        <item.icon
                          className={`size-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-orange-500"
                              : "text-slate-400 group-hover/menu-item:text-white"
                          }`}
                        />
                        <span
                          className={`font-medium text-[13px] tracking-wide transition-colors group-data-[collapsible=icon]:hidden ${
                            isActive
                              ? "text-orange-500 font-semibold"
                              : "text-slate-300 group-hover/menu-item:text-white"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </>
  );
}
