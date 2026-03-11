import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { getChoreInstances } from "@/lib/chores/queries";
import { ChoreBoard } from "@/components/chores/chore-board";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export default async function ChoresPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const instances = await getChoreInstances(membership.householdId, {
    status: "pending",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Chore Board</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage and track household chores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/chores/templates"
            className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-xl transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/dashboard/chores/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Chore
          </Link>
        </div>
      </div>

      <ChoreBoard
        initialInstances={instances}
        currentMemberId={membership.memberId}
        householdId={membership.householdId}
      />
    </div>
  );
}
