"use client";

import { Calendar, Star, User } from "lucide-react";
import { CompleteChoreButton } from "./complete-chore-button";

interface ChoreCardProps {
  instance: {
    id: string;
    title: string;
    points: number;
    due_date: string;
    assigned_to: string | null;
    status: string;
    assigned_member: {
      id: string;
      users: { display_name: string };
    } | null;
  };
  householdId: string;
}

export function ChoreCard({ instance, householdId }: ChoreCardProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isOverdue = instance.due_date < today;
  const isToday = instance.due_date === today;

  const formattedDate = new Date(instance.due_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-slate-900 truncate">
            {instance.title}
          </h3>
          <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">
            <Star className="w-3 h-3" />
            {instance.points}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span
            className={`flex items-center gap-1 ${
              isOverdue
                ? "text-red-600 font-medium"
                : isToday
                  ? "text-indigo-600 font-medium"
                  : ""
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {isOverdue ? "Overdue · " : isToday ? "Today · " : ""}
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {instance.assigned_member?.users?.display_name ?? "Unassigned"}
          </span>
        </div>
      </div>

      {instance.status === "pending" && (
        <CompleteChoreButton
          instanceId={instance.id}
          householdId={householdId}
        />
      )}
    </div>
  );
}
