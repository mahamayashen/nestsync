"use client";

import { useState, useTransition } from "react";
import { Shield, ArrowsLeftRight, Trash } from "@phosphor-icons/react";
import { reassignChore, deleteChoreTemplate } from "@/lib/chores/actions";
import type { ChoreTemplateRow } from "@/lib/chores/queries";
import type { HouseholdMemberWithUser } from "@/lib/household/members";

const DAY_LABELS: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function formatSchedule(template: ChoreTemplateRow): string {
  if (template.recurrence === "one_time") return "One-time";
  if (template.schedule_days && template.schedule_days.length > 0) {
    if (template.schedule_days.length === 7) return "Daily";
    const sorted = [...template.schedule_days].sort((a, b) => {
      // Sort Mon(1)..Sat(6), Sun(0)
      const aVal = a === 0 ? 7 : a;
      const bVal = b === 0 ? 7 : b;
      return aVal - bVal;
    });
    return sorted.map((d) => DAY_LABELS[d]).join(", ");
  }
  // Legacy
  return template.recurrence.replace("_", "-");
}

interface AdminChoreManagerProps {
  householdId: string;
  members: HouseholdMemberWithUser[];
  initialTemplates: ChoreTemplateRow[];
}

export function AdminChoreManager({
  householdId,
  members,
  initialTemplates,
}: AdminChoreManagerProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [filterMember, setFilterMember] = useState<string>("all");
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const memberMap: Record<string, string> = {};
  for (const m of members) {
    memberMap[m.id] = m.users.display_name;
  }

  const filtered =
    filterMember === "all"
      ? templates
      : templates.filter((t) => t.assigned_member?.id === filterMember);

  const handleReassign = (templateId: string, newAssignee: string) => {
    const fd = new FormData();
    fd.set("templateId", templateId);
    fd.set("newAssignee", newAssignee);

    setActionError(null);
    startTransition(async () => {
      const result = await reassignChore(fd);
      if (result.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  assigned_member: {
                    id: newAssignee,
                    users: {
                      display_name: memberMap[newAssignee] ?? "Unknown",
                    },
                  },
                }
              : t
          )
        );
        setReassigning(null);
      } else if (result.error) {
        setActionError(result.error);
        setReassigning(null);
      }
    });
  };

  const handleDelete = (templateId: string) => {
    const fd = new FormData();
    fd.set("templateId", templateId);

    setActionError(null);
    startTransition(async () => {
      const result = await deleteChoreTemplate(fd);
      if (result.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        setConfirmDelete(null);
      } else if (result.error) {
        setActionError(result.error);
        setConfirmDelete(null);
      }
    });
  };

  if (templates.length === 0) return null;

  return (
    <div className="bg-surface rounded-xl border border-border-light p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={20} weight="fill" className="text-primary" />
          <h2 className="text-lg font-bold text-text-primary font-heading">
            Manage Chores
          </h2>
        </div>

        {/* Member filter */}
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.users.display_name}
            </option>
          ))}
        </select>
      </div>

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
          {actionError}
        </p>
      )}

      <div className="space-y-1">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-secondary transition-colors group"
          >
            {/* Template info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {template.title}
              </p>
              <p className="text-xs text-text-muted">
                {formatSchedule(template)} &middot; {template.points} pts
                &middot;{" "}
                {template.assigned_member?.users?.display_name ?? "Unassigned"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {reassigning === template.id ? (
                <select
                  autoFocus
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleReassign(template.id, e.target.value);
                    }
                  }}
                  onBlur={() => setReassigning(null)}
                  className="px-2 py-1 rounded-lg border border-primary text-xs text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    Assign to...
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.users.display_name}
                    </option>
                  ))}
                </select>
              ) : confirmDelete === template.id ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-text-muted">Delete?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(template.id)}
                    disabled={isPending}
                    className="px-2 py-0.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-0.5 rounded text-xs text-text-muted hover:text-text-secondary hover:bg-surface-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setReassigning(template.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light/50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Reassign"
                  >
                    <ArrowsLeftRight size={16} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(template.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
