"use client";

import Link from "next/link";
import {
  Fire,
  Star,
  ArrowRight,
  Trophy,
  Target,
} from "@phosphor-icons/react";
import { WeeklyStats } from "@/components/chores/weekly-stats";

interface ChoreInstance {
  id: string;
  title: string;
  points: number;
  due_date: string;
  assigned_to: string | null;
  assigned_member: {
    id: string;
    users: { display_name: string };
  } | null;
}

interface DashboardHomeProps {
  userName: string;
  householdId: string;
  todayChores: ChoreInstance[];
  weeklyStats: {
    memberId: string;
    displayName: string;
    points: number;
    count: number;
  }[];
  todayProgress: { completed: number; total: number };
  householdStreak: number;
}

// SVG circular progress ring
function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border-light"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={progress >= 1 ? "text-success" : "text-primary"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary">{completed}</span>
        <span className="text-[10px] text-text-muted">of {total}</span>
      </div>
    </div>
  );
}

export function DashboardHome({
  userName,
  householdId,
  todayChores,
  weeklyStats,
  todayProgress,
  householdStreak,
}: DashboardHomeProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const mvp = weeklyStats.length > 0 ? weeklyStats[0] : null;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-heading">
          Welcome back, {userName}
        </h1>
        <p className="text-text-secondary mt-1">{today}</p>
      </div>

      {/* Household Pulse stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Progress — circular ring */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-primary/15 p-5 flex items-center gap-4 shadow-sm">
          <ProgressRing
            completed={todayProgress.completed}
            total={todayProgress.total}
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Today&apos;s Progress
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {todayProgress.total === 0
                ? "No chores scheduled"
                : todayProgress.completed === todayProgress.total
                  ? "All done! Great job!"
                  : `${todayProgress.total - todayProgress.completed} remaining`}
            </p>
          </div>
        </div>

        {/* Household Streak */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-highlight/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-highlight-light rounded-lg flex items-center justify-center">
              <Fire className="w-5 h-5 text-highlight" weight="fill" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {householdStreak}
                <span className="text-sm font-normal text-text-muted ml-1">
                  {householdStreak === 1 ? "day" : "days"}
                </span>
              </p>
              <p className="text-sm text-text-secondary">Household streak</p>
            </div>
          </div>
        </div>

        {/* This Week's MVP */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-accent/15 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-light rounded-lg flex items-center justify-center">
              {mvp ? (
                <Trophy className="w-5 h-5 text-accent" weight="fill" />
              ) : (
                <Target className="w-5 h-5 text-accent" />
              )}
            </div>
            <div>
              {mvp ? (
                <>
                  <p className="text-sm font-bold text-text-primary">
                    {mvp.displayName}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 text-accent" weight="fill" />
                    {mvp.points} pts &middot; Week&apos;s MVP
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-primary">
                    No MVP yet
                  </p>
                  <p className="text-xs text-text-secondary">
                    Complete chores to lead!
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's chores */}
        <div className="bg-surface rounded-xl border border-border-light p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Today&apos;s Chores
            </h3>
            <Link
              href="/dashboard/my"
              className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {todayChores.length === 0 ? (
            <p className="text-sm text-text-muted">
              No chores due today. Enjoy your day!
            </p>
          ) : (
            <div className="space-y-2">
              {todayChores.slice(0, 5).map((chore) => (
                <div
                  key={chore.id}
                  className="flex items-center justify-between py-2 border-b border-border-light/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">
                      {chore.title}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs text-accent bg-accent-light px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3" />
                      {chore.points}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {chore.assigned_member?.users?.display_name ?? "Unassigned"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly stats */}
        <WeeklyStats householdId={householdId} initialStats={weeklyStats} />
      </div>
    </div>
  );
}
