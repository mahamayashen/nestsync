"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  DollarSign,
  Megaphone,
  Vote,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home, enabled: true },
  {
    href: "/dashboard/chores",
    label: "Chores",
    icon: ClipboardList,
    enabled: true,
  },
  {
    href: "/dashboard/expenses",
    label: "Expenses",
    icon: DollarSign,
    enabled: false,
  },
  { href: "/dashboard/feed", label: "Feed", icon: Megaphone, enabled: false },
  { href: "/dashboard/votes", label: "Votes", icon: Vote, enabled: false },
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 cursor-not-allowed"
              title="Coming soon"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
              <span className="ml-auto text-xs bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
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
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
