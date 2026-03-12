import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { getProposals } from "@/lib/proposals/queries";
import { expireProposals } from "@/lib/proposals/actions";
import { getHouseholdMembers } from "@/lib/household/members";
import { createClient } from "@/lib/supabase/server";
import { ProposalFeed } from "@/components/proposals/proposal-feed";

export default async function VotesPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  // Resolve overdue proposals before rendering
  await expireProposals();

  const supabase = await createClient();

  const [proposals, members, memberData] = await Promise.all([
    getProposals(membership.householdId),
    getHouseholdMembers(membership.householdId),
    supabase
      .from("household_members")
      .select("joined_at")
      .eq("id", membership.memberId)
      .single(),
  ]);

  const joinedAt = memberData.data?.joined_at ?? new Date().toISOString();

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-heading">
          Votes
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Household proposals and governance
        </p>
      </div>

      <ProposalFeed
        initialProposals={proposals}
        householdId={membership.householdId}
        currentMemberId={membership.memberId}
        currentMemberJoinedAt={joinedAt}
        currentMemberRole={membership.role}
        members={members}
      />
    </div>
  );
}
