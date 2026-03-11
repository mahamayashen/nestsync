"use client";

import Link from "next/link";
import {
  ClipboardText,
  CalendarBlank,
  Star,
  ArrowRight,
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
  myPendingCount: number;
  totalPendingCount: number;
  todayChores: ChoreInstance[];
  weeklyStats: {
    memberId: string;
    displayName: string;
    points: number;
    count: number;
  }[];
}

export function DashboardHome({
  userName,
  householdId,
  myPendingCount,
  totalPendingCount,
  todayChores,
  weeklyStats,
}: DashboardHomeProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-heading">
          Welcome back, {userName}
        </h1>
        <p className="text-text-secondary mt-1">{today}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border-light p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
              <ClipboardText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {myPendingCount}
              </p>
              <p className="text-sm text-text-secondary">My pending chores</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border-light p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-highlight-light rounded-lg flex items-center justify-center">
              <CalendarBlank className="w-5 h-5 text-highlight" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {todayChores.length}
              </p>
              <p className="text-sm text-text-secondary">Due today</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border-light p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-light rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {totalPendingCount}
              </p>
              <p className="text-sm text-text-secondary">Total household chores</p>
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
              href="/dashboard/chores"
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
