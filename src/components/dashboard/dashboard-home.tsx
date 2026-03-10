"use client";

import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  Star,
  ArrowRight,
} from "lucide-react";
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
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {userName}
        </h1>
        <p className="text-slate-500 mt-1">{today}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {myPendingCount}
              </p>
              <p className="text-sm text-slate-500">My pending chores</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {todayChores.length}
              </p>
              <p className="text-sm text-slate-500">Due today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {totalPendingCount}
              </p>
              <p className="text-sm text-slate-500">Total household chores</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's chores */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Today&apos;s Chores
            </h3>
            <Link
              href="/dashboard/chores"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {todayChores.length === 0 ? (
            <p className="text-sm text-slate-400">
              No chores due today. Enjoy your day!
            </p>
          ) : (
            <div className="space-y-2">
              {todayChores.slice(0, 5).map((chore) => (
                <div
                  key={chore.id}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700">
                      {chore.title}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3" />
                      {chore.points}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
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
