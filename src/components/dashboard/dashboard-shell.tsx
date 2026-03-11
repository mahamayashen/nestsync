"use client";

import { useState } from "react";
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
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border-light transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border-light">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-text-on-primary text-sm font-logo">N</span>
              </div>
              <span className="font-logo text-xl text-primary">NestSync</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded text-text-muted hover:text-text-secondary"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Household name */}
          <div className="px-4 py-3 border-b border-border-light">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
              Household
            </p>
            <p className="text-sm font-medium text-text-primary truncate mt-0.5">
              {household.name}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </div>

          {/* Sidebar footer */}
          <div className="px-4 py-3 border-t border-border-light">
            <p className="text-xs text-text-muted truncate">
              {user.display_name} ·{" "}
              {membership.role === "admin" ? "Admin" : "Member"}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <TopBar
          householdName={household.name}
          inviteCode={household.invite_code}
          userName={user.display_name}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="p-4 lg:p-6 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
