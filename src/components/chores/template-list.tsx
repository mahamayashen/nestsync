"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { TemplateCard } from "./template-card";
import { ClipboardList } from "lucide-react";

interface TemplateListProps {
  initialTemplates: Array<{
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
  }>;
  currentMemberId: string;
  memberRole: string;
  householdId: string;
}

export function TemplateList({
  initialTemplates,
  currentMemberId,
  memberRole,
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
        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No chore templates yet</p>
      </div>
    );
  }

  // D3 permission: admin can always delete, members can delete if setting allows
  const canDelete = memberRole === "admin"; // Simplified — full D3 check is in server action

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          canDelete={canDelete || template.creator?.id === currentMemberId}
          householdId={householdId}
        />
      ))}
    </div>
  );
}
