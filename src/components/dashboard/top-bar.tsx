"use client";

import { useState } from "react";
import { Copy, Check, LogOut, Menu } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

interface TopBarProps {
  householdName: string;
  inviteCode: string;
  userName: string;
  onMenuToggle: () => void;
}

export function TopBar({
  householdName,
  inviteCode,
  userName,
  onMenuToggle,
}: TopBarProps) {
  const [copied, setCopied] = useState(false);

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-slate-900 hidden sm:block">
          {householdName}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={copyInviteCode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title={`Invite code: ${inviteCode}`}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {copied ? "Copied!" : "Invite"}
          </span>
        </button>

        <span className="text-sm text-slate-500 hidden md:inline">
          {userName}
        </span>

        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
