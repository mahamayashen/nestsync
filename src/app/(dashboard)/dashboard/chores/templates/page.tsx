import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { createClient } from "@/lib/supabase/server";
import { getChoreTemplates } from "@/lib/chores/queries";
import { TemplateList } from "@/components/chores/template-list";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export default async function ChoreTemplatesPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();

  const [templates, householdResult] = await Promise.all([
    getChoreTemplates(membership.householdId),
    supabase
      .from("households")
      .select("members_can_edit_own_chores")
      .eq("id", membership.householdId)
      .single(),
  ]);

  const membersCanEditOwnChores =
    householdResult.data?.members_can_edit_own_chores ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">
            Chore Templates
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage recurring chore definitions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/chores"
            className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-xl transition-colors"
          >
            Board
          </Link>
          <Link
            href="/dashboard/chores/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Link>
        </div>
      </div>

      <TemplateList
        initialTemplates={templates}
        currentMemberId={membership.memberId}
        memberRole={membership.role}
        membersCanEditOwnChores={membersCanEditOwnChores}
        householdId={membership.householdId}
      />
    </div>
  );
}
