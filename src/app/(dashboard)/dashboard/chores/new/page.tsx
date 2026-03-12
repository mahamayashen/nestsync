import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { getHouseholdMembers } from "@/lib/household/members";
import { CreateChoreForm } from "@/components/chores/create-chore-form";

export default async function NewChorePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const members = await getHouseholdMembers(membership.householdId);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">
          Create a New Chore
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Set up a recurring or one-time chore for your household
        </p>
      </div>

      <CreateChoreForm members={members} currentMemberId={membership.memberId} />
    </div>
  );
}
