"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";
import {
  House,
  ClipboardText,
  CurrencyDollar,
  Megaphone,
  Scales,
} from "@phosphor-icons/react";

const navItems: { href: string; label: string; icon: Icon; enabled: boolean }[] = [
  { href: "/dashboard", label: "Home", icon: House, enabled: true },
  {
    href: "/dashboard/chores",
    label: "Chores",
    icon: ClipboardText,
    enabled: true,
  },
  {
    href: "/dashboard/expenses",
    label: "Expenses",
    icon: CurrencyDollar,
    enabled: false,
  },
  { href: "/dashboard/feed", label: "Feed", icon: Megaphone, enabled: false },
  { href: "/dashboard/votes", label: "Votes", icon: Scales, enabled: false },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        if (!item.enabled) {
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted cursor-not-allowed"
              title="Coming soon"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
              <span className="ml-auto text-xs bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded">
                Soon
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? "bg-primary-light text-primary-hover"
                : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
