import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { getChoreTemplates } from "@/lib/chores/queries";
import { TemplateList } from "@/components/chores/template-list";
import { Plus } from "lucide-react";

export default async function ChoreTemplatesPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const templates = await getChoreTemplates(membership.householdId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Chore Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage recurring chore definitions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/chores"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Board
          </Link>
          <Link
            href="/dashboard/chores/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Link>
        </div>
      </div>

      <TemplateList
        initialTemplates={templates as never[]}
        currentMemberId={membership.memberId}
        memberRole={membership.role}
        householdId={membership.householdId}
      />
    </div>
  );
}
