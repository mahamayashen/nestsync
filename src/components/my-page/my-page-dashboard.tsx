"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import {
  Fire,
  Timer,
  TrendUp,
  TrendDown,
  Minus,
  Plus,
  CalendarBlank,
  ClipboardText,
  CheckCircle,
} from "@phosphor-icons/react";
import { ChoreCard } from "@/components/chores/chore-card";
import type { ChoreInstanceRow } from "@/lib/chores/queries";

interface MyPageDashboardProps {
  userName: string;
  householdId: string;
  currentMemberId: string;
  myPendingChores: ChoreInstanceRow[];
  myStreak: number;
  onTimeRate: { onTime: number; total: number; rate: number };
  weekComparison: { thisWeek: number; lastWeek: number; diff: number };
}

export function MyPageDashboard({
  userName,
  householdId,
  currentMemberId,
  myPendingChores,
  myStreak,
  onTimeRate,
  weekComparison,
}: MyPageDashboardProps) {
  const supabase = useSupabase();

  const { data: pendingChores } = useQuery({
    queryKey: ["chore-instances", householdId, "my-pending", currentMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chore_instances")
        .select(
          `*, assigned_member:household_members!chore_instances_assigned_to_fkey(id, users!inner(display_name)),
          completed_member:household_members!chore_instances_completed_by_fkey(id, users!inner(display_name))`
        )
        .eq("household_id", householdId)
        .eq("status", "pending")
        .eq("assigned_to", currentMemberId)
        .order("due_date", { ascending: true });
      if (error) return [];
      return data as unknown as ChoreInstanceRow[];
    },
    initialData: myPendingChores,
    staleTime: 0,
  });

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayChores = pendingChores.filter((c) => c.due_date === today);
  const upcomingChores = pendingChores.filter((c) => c.due_date > today);
  const overdueChores = pendingChores.filter((c) => c.due_date < today);

  // Week comparison display
  const trendIcon =
    weekComparison.diff > 0 ? (
      <TrendUp className="w-4 h-4 text-success" weight="bold" />
    ) : weekComparison.diff < 0 ? (
      <TrendDown className="w-4 h-4 text-error" weight="bold" />
    ) : (
      <Minus className="w-4 h-4 text-text-muted" />
    );

  const trendLabel =
    weekComparison.diff > 0
      ? `+${weekComparison.diff} pts`
      : weekComparison.diff < 0
        ? `${weekComparison.diff} pts`
        : "Same";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">
            My Page
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {userName}&apos;s personal stats and chores
          </p>
        </div>
        <Link
          href="/dashboard/chores/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Chore
        </Link>
      </div>

      {/* Personal Growth stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* My Streak */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-highlight/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-highlight-light rounded-lg flex items-center justify-center">
              <Fire className="w-5 h-5 text-highlight" weight="fill" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {myStreak}
                <span className="text-sm font-normal text-text-muted ml-1">
                  {myStreak === 1 ? "day" : "days"}
                </span>
              </p>
              <p className="text-sm text-text-secondary">My streak</p>
            </div>
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-sage-solid/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage-medium rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5 text-primary" weight="fill" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {onTimeRate.total > 0 ? `${onTimeRate.rate}%` : "—"}
              </p>
              <p className="text-sm text-text-secondary">
                On-time rate
                {onTimeRate.total > 0 && (
                  <span className="text-text-muted">
                    {" "}
                    ({onTimeRate.onTime}/{onTimeRate.total})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-accent/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-light rounded-lg flex items-center justify-center">
              {trendIcon}
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {trendLabel}
              </p>
              <p className="text-sm text-text-secondary">
                vs last week
                {weekComparison.thisWeek > 0 && (
                  <span className="text-text-muted">
                    {" "}
                    ({weekComparison.thisWeek} pts)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's chores */}
      {todayChores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
            <CalendarBlank className="w-4 h-4 text-primary" />
            Due Today ({todayChores.length})
          </h2>
          <div className="space-y-2">
            {todayChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                instance={chore}
                householdId={householdId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overdue chores */}
      {overdueChores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-error flex items-center gap-2 mb-3">
            <CalendarBlank className="w-4 h-4" />
            Overdue ({overdueChores.length})
          </h2>
          <div className="space-y-2">
            {overdueChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                instance={chore}
                householdId={householdId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming chores */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
          <ClipboardText className="w-4 h-4 text-text-secondary" />
          Upcoming ({upcomingChores.length})
        </h2>
        {upcomingChores.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border-light p-8 text-center">
            <CheckCircle className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              No upcoming chores. You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                instance={chore}
                householdId={householdId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
