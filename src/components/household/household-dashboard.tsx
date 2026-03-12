"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import {
  UsersThree,
  Plus,
  Timer,
  Target,
  Scales,
} from "@phosphor-icons/react";
import { MemberCard } from "./member-card";
import { AdminChoreManager } from "./admin-chore-manager";
import { WeeklyStats } from "@/components/chores/weekly-stats";
import type { ChoreInstanceRow, ChoreTemplateRow } from "@/lib/chores/queries";
import type { HouseholdMemberWithUser } from "@/lib/household/members";

interface HouseholdDashboardProps {
  householdId: string;
  currentMemberId: string;
  members: HouseholdMemberWithUser[];
  weeklyStats: {
    memberId: string;
    displayName: string;
    points: number;
    count: number;
  }[];
  allPendingChores: ChoreInstanceRow[];
  teamOnTimeRate: { onTime: number; total: number; rate: number };
  todayProgress: { completed: number; total: number };
  memberOnTimeRates: Record<string, { rate: number; total: number }>;
  isAdmin?: boolean;
  templates?: ChoreTemplateRow[];
}

// Simple horizontal workload bar
function WorkloadBar({
  members,
  pendingByMember,
}: {
  members: HouseholdMemberWithUser[];
  pendingByMember: Map<string, number>;
}) {
  const maxPending = Math.max(
    1,
    ...Array.from(pendingByMember.values())
  );

  return (
    <div className="space-y-2.5">
      {members.map((m) => {
        const count = pendingByMember.get(m.id) ?? 0;
        const pct = (count / maxPending) * 100;
        const name = m.users.display_name;

        return (
          <div key={m.id} className="flex items-center gap-3">
            <span className="text-xs text-text-secondary w-20 truncate text-right">
              {name}
            </span>
            <div className="flex-1 bg-surface-secondary rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                style={{ width: `${Math.max(pct, 8)}%` }}
              >
                {count > 0 && (
                  <span className="text-[10px] font-bold text-text-on-primary">
                    {count}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HouseholdDashboard({
  householdId,
  currentMemberId,
  members,
  weeklyStats,
  allPendingChores,
  teamOnTimeRate,
  todayProgress,
  memberOnTimeRates,
  isAdmin,
  templates,
}: HouseholdDashboardProps) {
  const supabase = useSupabase();

  const { data: pendingChores } = useQuery({
    queryKey: ["chore-instances", householdId, "all-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chore_instances")
        .select(
          `*, assigned_member:household_members!chore_instances_assigned_to_fkey(id, users!inner(display_name)),
          completed_member:household_members!chore_instances_completed_by_fkey(id, users!inner(display_name))`
        )
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("due_date", { ascending: true });
      if (error) return [];
      return data as unknown as ChoreInstanceRow[];
    },
    initialData: allPendingChores,
    staleTime: 0,
  });

  // Build stats map for member cards
  const statsMap = new Map(
    weeklyStats.map((s) => [s.memberId, s])
  );

  // Build pending count per member
  const pendingByMember = new Map<string, number>();
  for (const c of pendingChores) {
    if (c.assigned_to) {
      pendingByMember.set(
        c.assigned_to,
        (pendingByMember.get(c.assigned_to) ?? 0) + 1
      );
    }
  }

  // Team completion rate for this week
  const totalWeeklyCompleted = weeklyStats.reduce((sum, s) => sum + s.count, 0);
  const totalWeeklyChores = totalWeeklyCompleted + pendingChores.length;
  const teamCompletionRate =
    totalWeeklyChores > 0
      ? Math.round((totalWeeklyCompleted / totalWeeklyChores) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">
            Household
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Team stats, fairness, and activity
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

      {/* Team Fairness stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Team Completion Rate */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-primary/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" weight="fill" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {teamCompletionRate}%
              </p>
              <p className="text-sm text-text-secondary">
                Completion rate
                <span className="text-text-muted"> (this week)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Team On-Time Rate */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-sage-solid/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage-medium rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5 text-accent" weight="fill" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {teamOnTimeRate.total > 0 ? `${teamOnTimeRate.rate}%` : "—"}
              </p>
              <p className="text-sm text-text-secondary">
                Team on-time rate
                {teamOnTimeRate.total > 0 && (
                  <span className="text-text-muted">
                    {" "}
                    (30d)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Household Progress */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-highlight/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-highlight-light rounded-lg flex items-center justify-center">
              <Scales className="w-5 h-5 text-highlight" weight="fill" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {todayProgress.completed}
                <span className="text-sm font-normal text-text-muted">
                  /{todayProgress.total}
                </span>
              </p>
              <p className="text-sm text-text-secondary">Done today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Balance */}
      <div className="bg-surface rounded-xl border border-border-light p-5">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Scales className="w-4 h-4 text-primary" />
          Workload Balance
        </h3>
        <WorkloadBar members={members} pendingByMember={pendingByMember} />
      </div>

      {/* Members grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
          <UsersThree className="w-4 h-4 text-primary" />
          Members ({members.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((member) => {
            const memberStats = statsMap.get(member.id);
            const memberPending = pendingByMember.get(member.id) ?? 0;
            return (
              <MemberCard
                key={member.id}
                member={member}
                pendingCount={memberPending}
                weeklyPoints={memberStats?.points ?? 0}
                weeklyCompleted={memberStats?.count ?? 0}
                onTimeRate={memberOnTimeRates[member.id]}
              />
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <WeeklyStats householdId={householdId} initialStats={weeklyStats} />

      {/* Admin chore management */}
      {isAdmin && templates && templates.length > 0 && (
        <AdminChoreManager
          householdId={householdId}
          members={members}
          initialTemplates={templates}
        />
      )}
    </div>
  );
}
