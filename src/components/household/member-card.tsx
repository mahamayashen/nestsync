"use client";

import { Star, Timer, Crown, CheckCircle } from "@phosphor-icons/react";

interface MemberCardProps {
  member: {
    id: string;
    role: string;
    users: { display_name: string; avatar_url: string | null };
  };
  pendingCount: number;
  weeklyPoints: number;
  weeklyCompleted: number;
  onTimeRate?: { rate: number; total: number };
}

export function MemberCard({
  member,
  pendingCount,
  weeklyPoints,
  weeklyCompleted,
  onTimeRate,
}: MemberCardProps) {
  const name = member.users.display_name;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-sage-solid/15 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-sage-medium flex items-center justify-center text-primary font-bold text-sm">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary truncate">
              {name}
            </span>
            {member.role === "admin" && (
              <Crown className="w-3.5 h-3.5 text-accent flex-shrink-0" weight="fill" />
            )}
          </div>
          <span className="text-xs text-text-muted capitalize">
            {member.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-surface-secondary rounded-lg py-2 px-1">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Star className="w-3 h-3 text-accent" weight="fill" />
          </div>
          <p className="text-sm font-bold text-text-primary">{weeklyPoints}</p>
          <p className="text-[10px] text-text-muted">Points</p>
        </div>
        <div className="bg-surface-secondary rounded-lg py-2 px-1">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <CheckCircle className="w-3 h-3 text-success" />
          </div>
          <p className="text-sm font-bold text-text-primary">{weeklyCompleted}</p>
          <p className="text-[10px] text-text-muted">Done</p>
        </div>
        <div className="bg-surface-secondary rounded-lg py-2 px-1">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Timer className="w-3 h-3 text-primary" />
          </div>
          <p className="text-sm font-bold text-text-primary">
            {onTimeRate && onTimeRate.total > 0 ? `${onTimeRate.rate}%` : "—"}
          </p>
          <p className="text-[10px] text-text-muted">On-time</p>
        </div>
      </div>

      {/* Pending badge */}
      {pendingCount > 0 && (
        <div className="mt-3 text-xs text-text-muted text-center">
          {pendingCount} pending {pendingCount === 1 ? "chore" : "chores"}
        </div>
      )}
    </div>
  );
}
