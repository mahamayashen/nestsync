"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { Trophy, Star } from "@phosphor-icons/react";

interface WeeklyStatsProps {
  householdId: string;
  initialStats?: {
    memberId: string;
    displayName: string;
    points: number;
    count: number;
  }[];
}

export function WeeklyStats({ householdId, initialStats }: WeeklyStatsProps) {
  const supabase = useSupabase();

  const { data: stats } = useQuery({
    queryKey: ["chore-stats", householdId],
    queryFn: async () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("chore_instances")
        .select(
          "completed_by, points, household_members!chore_instances_completed_by_fkey(id, users!inner(display_name))"
        )
        .eq("household_id", householdId)
        .eq("status", "completed")
        .not("completed_by", "is", null)
        .gte("completed_at", monday.toISOString())
        .lte("completed_at", sunday.toISOString());

      if (error || !data) return [];

      const statsMap = new Map<
        string,
        {
          memberId: string;
          displayName: string;
          points: number;
          count: number;
        }
      >();

      for (const row of data) {
        const memberId = row.completed_by!;
        const existing = statsMap.get(memberId);
        const member = row.household_members as unknown as {
          id: string;
          users: { display_name: string };
        } | null;
        const displayName = member?.users?.display_name ?? "Unknown";

        if (existing) {
          existing.points += row.points;
          existing.count += 1;
        } else {
          statsMap.set(memberId, {
            memberId,
            displayName,
            points: row.points,
            count: 1,
          });
        }
      }

      return Array.from(statsMap.values()).sort((a, b) => b.points - a.points);
    },
    initialData: initialStats,
  });

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border-light p-5">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-accent" />
          This Week&apos;s Points
        </h3>
        <p className="text-sm text-text-muted">No chores completed this week</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border-light p-5">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-accent" />
        This Week&apos;s Points
      </h3>
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div
            key={stat.memberId}
            className="flex items-center justify-between py-1.5"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold w-5 text-center ${
                  index === 0
                    ? "text-accent"
                    : index === 1
                      ? "text-text-muted"
                      : "text-highlight"
                }`}
              >
                {index + 1}
              </span>
              <span className="text-sm text-text-primary">
                {stat.displayName}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-3.5 h-3.5 text-accent" />
              <span className="font-medium text-text-primary">{stat.points}</span>
              <span className="text-text-muted">
                ({stat.count} {stat.count === 1 ? "chore" : "chores"})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
