"use client";

import { useState } from "react";
import { Copy, Check, SignOut, List } from "@phosphor-icons/react";
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
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable or permission denied — silently ignore
    }
  };

  return (
    <header className="h-16 border-b border-border-light bg-surface flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-secondary"
          aria-label="Toggle sidebar"
        >
          <List className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-text-primary hidden sm:block">
          {householdName}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={copyInviteCode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
          title={`Invite code: ${inviteCode}`}
          aria-label={copied ? "Invite code copied" : "Copy invite code"}
        >
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {copied ? "Copied!" : "Invite"}
          </span>
        </button>

        <span className="text-sm text-text-secondary hidden md:inline">
          {userName}
        </span>

        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-error hover:bg-error-light rounded-lg transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <SignOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
