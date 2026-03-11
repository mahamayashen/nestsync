"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { TemplateCard } from "./template-card";
import { ClipboardText } from "@phosphor-icons/react";
import type { ChoreTemplateRow } from "@/lib/chores/queries";

interface TemplateListProps {
  initialTemplates: ChoreTemplateRow[];
  currentMemberId: string;
  memberRole: string;
  membersCanEditOwnChores: boolean;
  householdId: string;
}

export function TemplateList({
  initialTemplates,
  currentMemberId,
  memberRole,
  membersCanEditOwnChores,
  householdId,
}: TemplateListProps) {
  const supabase = useSupabase();

  const { data: templates } = useQuery({
    queryKey: ["chore-templates", householdId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chore_templates")
        .select(
          `
          *,
          assigned_member:household_members!chore_templates_assigned_to_fkey(
            id,
            users!inner(display_name)
          ),
          creator:household_members!chore_templates_created_by_fkey(
            id,
            users!inner(display_name)
          )
        `
        )
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      return (data ?? []) as typeof initialTemplates;
    },
    initialData: initialTemplates,
  });

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardText className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-secondary">No chore templates yet</p>
      </div>
    );
  }

  // Align with server-side D3 permission: admin can always delete;
  // members can only delete their own templates when the household setting allows it.
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          canDelete={
            memberRole === "admin" ||
            (membersCanEditOwnChores &&
              template.creator?.id === currentMemberId)
          }
          householdId={householdId}
        />
      ))}
    </div>
  );
}
