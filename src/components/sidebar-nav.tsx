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
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BellRing,
  Command,
  Settings,
  Headset,
  Paperclip,
  CreditCard,
  Users,
  Ticket,
} from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const menuGroups = [
    {
      label: "Platform",
      items: [
        {
          href: "/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
        },
      ],
    },
    ...(userRole === "ADMINISTRATOR"
      ? [
          {
            label: "Users",
            items: [
              {
                href: "/users/manage",
                icon: Users,
                label: "Users",
              },
              {
                href: "/customers",
                icon: Ticket,
                label: "Customers",
              },
            ],
          },
        ]
      : []),

    {
      label: "Inventory",
      items: [
        { href: "/products", icon: Settings, label: "Products" },
        { href: "/orders", icon: Settings, label: "Orders" },
        { href: "/payments", icon: CreditCard, label: "Payments" },
      ],
    },
    {
      label: "Settings",
      items: [
        { href: "/shipping", icon: Settings, label: "Shipping" },
        { href: "/promocode", icon: Settings, label: "Promocodes" },
      ],
    },
    {
      label: "Communication",
      items: [
        { href: "/blog", icon: Paperclip, label: "Blog" },
        { href: "/support", icon: Headset, label: "Support" },
        { href: "/notifications", icon: BellRing, label: "Notification" },
      ],
    },
  ];

  return (
    <>
      <SidebarHeader className="pt-3 pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent focus:bg-transparent active:bg-transparent group-data-[collapsible=icon]:justify-center"
            >
              <Link href="/dashboard" className="gap-3">
                <Command className="size-4 text-white" strokeWidth={2.5} />

                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden transition-opacity">
                  <span className="truncate text-[15px] font-semibold tracking-tight text-white uppercase">
                    Shop Admin
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pb-4 gap-0">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="pt-1">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5 px-2">
              {group.label}
            </SidebarGroupLabel>

            <SidebarMenu className="gap-0.5 px-1.5 group-data-[collapsible=icon]:px-0">
              {group.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      // FIX: Removed the generic "group" class from here
                      className={`h-8 transition-all duration-200 group-data-[collapsible=icon]:justify-center rounded-xl ${
                        isActive
                          ? "bg-transparent hover:bg-transparent"
                          : "hover:bg-white/30"
                      }`}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5"
                      >
                        <item.icon
                          // FIX: Used the specific named group hover (group-hover/menu-item)
                          className={`size-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-orange-500"
                              : "text-slate-400 group-hover/menu-item:text-white"
                          }`}
                        />
                        <span
                          // FIX: Used the specific named group hover (group-hover/menu-item)
                          className={`font-medium text-[13px] transition-colors group-data-[collapsible=icon]:hidden ${
                            isActive
                              ? "text-orange-500"
                              : "text-slate-400 group-hover/menu-item:text-white"
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
