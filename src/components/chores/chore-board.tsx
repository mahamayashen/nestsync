"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { ChoreCard } from "./chore-card";
import { ClipboardList } from "lucide-react";
import type { ChoreInstanceRow } from "@/lib/chores/queries";

type Filter = "mine" | "all" | "unassigned";

interface ChoreBoardProps {
  initialInstances: ChoreInstanceRow[];
  currentMemberId: string;
  householdId: string;
}

const filterTabs: { key: Filter; label: string }[] = [
  { key: "mine", label: "My Chores" },
  { key: "all", label: "All Chores" },
  { key: "unassigned", label: "Unassigned" },
];

export function ChoreBoard({
  initialInstances,
  currentMemberId,
  householdId,
}: ChoreBoardProps) {
  const [filter, setFilter] = useState<Filter>("mine");
  const supabase = useSupabase();

  const { data: instances } = useQuery({
    queryKey: ["chore-instances", householdId, filter],
    queryFn: async () => {
      let query = supabase
        .from("chore_instances")
        .select(
          `
          *,
          assigned_member:household_members!chore_instances_assigned_to_fkey(
            id,
            users!inner(display_name)
          )
        `
        )
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("due_date", { ascending: true });

      if (filter === "mine") query = query.eq("assigned_to", currentMemberId);
      if (filter === "unassigned") query = query.is("assigned_to", null);

      const { data } = await query;
      return (data ?? []) as typeof initialInstances;
    },
    initialData:
      filter === "mine"
        ? initialInstances.filter((i) => i.assigned_to === currentMemberId)
        : filter === "unassigned"
          ? initialInstances.filter((i) => i.assigned_to === null)
          : initialInstances,
    staleTime: 0, // Always refetch on filter change
  });

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chore list */}
      {!instances || instances.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            {filter === "mine"
              ? "No chores assigned to you"
              : filter === "unassigned"
                ? "No unassigned chores"
                : "No pending chores"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {instances.map((instance) => (
            <ChoreCard
              key={instance.id}
              instance={instance}
              householdId={householdId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
