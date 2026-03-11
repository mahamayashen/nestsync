"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChoreTemplate } from "@/lib/chores/actions";
import { ArrowsClockwise, Trash, Star, SpinnerGap, User } from "@phosphor-icons/react";

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    recurrence: string;
    assigned_member: {
      id: string;
      users: { display_name: string };
    } | null;
    creator: {
      id: string;
      users: { display_name: string };
    } | null;
  };
  canDelete: boolean;
  householdId: string;
}

const recurrenceLabels: Record<string, string> = {
  one_time: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function TemplateCard({
  template,
  canDelete,
  householdId,
}: TemplateCardProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("templateId", template.id);
      return deleteChoreTemplate(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["chore-templates", householdId],
        });
      }
    },
  });

  return (
    <div className="bg-surface rounded-xl border border-border-light p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {template.title}
          </h3>
          {template.description && (
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
        {canDelete && (
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="p-1.5 text-text-muted hover:text-error hover:bg-error-light rounded-lg transition-colors flex-shrink-0"
            title="Delete template"
          >
            {deleteMutation.isPending ? (
              <SpinnerGap className="w-4 h-4 animate-spin" />
            ) : (
              <Trash className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs bg-primary-light text-primary px-2 py-1 rounded-md">
          <ArrowsClockwise className="w-3 h-3" />
          {recurrenceLabels[template.recurrence] ?? template.recurrence}
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-accent-light text-accent px-2 py-1 rounded-md">
          <Star className="w-3 h-3" />
          {template.points} {template.points === 1 ? "point" : "points"}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          {template.assigned_member?.users?.display_name ?? "Unassigned"}
        </span>
        <span>
          Created by {template.creator?.users?.display_name ?? "Unknown"}
        </span>
      </div>
    </div>
  );
}
