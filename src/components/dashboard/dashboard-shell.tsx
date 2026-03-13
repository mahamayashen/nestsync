"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "@phosphor-icons/react";
import { SidebarNav } from "./sidebar-nav";
import { TopBar } from "./top-bar";
import type { CurrentMembership } from "@/lib/household/queries";

interface DashboardShellProps {
  household: { id: string; name: string; invite_code: string; timezone: string };
  membership: CurrentMembership;
  user: { display_name: string; avatar_url: string | null };
  children: React.ReactNode;
}

export function DashboardShell({
  household,
  membership,
  user,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-surface/70 backdrop-blur-md border border-border-light transform transition-transform lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:rounded-2xl lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:shadow-lg ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header: logo + household */}
          <div className="px-4 pt-5 pb-4 border-b border-border-light/60">
            <div className="flex items-center justify-between">
              <span className="font-logo text-2xl text-primary">NestSync</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded text-text-muted hover:text-text-secondary"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium mt-3">
              Household
            </p>
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="block truncate mt-0.5 hover:opacity-80 transition-opacity"
              style={{
                fontFamily: "var(--font-handwritten)",
                color: "#7A9478",
                fontSize: "1.35rem",
              }}
            >
              {household.name}
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </div>

          {/* Sidebar footer */}
          <div className="px-4 py-3 border-t border-border-light/60">
            <p className="text-xs text-text-muted truncate">
              {user.display_name} ·{" "}
              {membership.role === "admin" ? "Admin" : "Member"}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <TopBar
          inviteCode={household.invite_code}
          userName={user.display_name}
          avatarUrl={user.avatar_url}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
