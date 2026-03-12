import { createClient } from "@/lib/supabase/server";

export type ProposalWithDetails = {
  id: string;
  household_id: string;
  type: "elect_admin" | "remove_member" | "custom";
  title: string;
  description: string | null;
  target_member_id: string | null;
  created_by: string;
  status: "active" | "passed" | "failed" | "expired";
  eligible_voter_count: number;
  min_participation_threshold: number;
  voting_deadline: string;
  resolved_at: string | null;
  created_at: string;
  target_member: {
    id: string;
    users: { display_name: string };
  } | null;
  creator: {
    id: string;
    users: { display_name: string };
  };
  votes: {
    id: string;
    member_id: string;
    vote: "yes" | "no";
    voted_at: string;
  }[];
};

/**
 * Fetch all proposals for a household, with creator/target member names and votes.
 */
export async function getProposals(
  householdId: string
): Promise<ProposalWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      *,
      target_member:household_members!proposals_target_member_id_fkey(
        id,
        users!inner(display_name)
      ),
      creator:household_members!proposals_created_by_fkey(
        id,
        users!inner(display_name)
      ),
      votes(id, member_id, vote, voted_at)
    `
    )
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as unknown as ProposalWithDetails[];
}
