import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ProposalStatus, VoteChoice } from "@/types";

// ---- Pure outcome evaluation (no DB) ----

export type ProposalOutcome = "passed" | "failed" | "expired";

/**
 * Evaluate the outcome of a proposal based on votes cast.
 *
 * Business rules:
 * - D8: Quorum = totalVotes / eligibleVoterCount >= threshold
 * - D9: Majority = yesCount > noCount (strict majority of those who voted)
 * - If quorum not met → "expired"
 */
export function evaluateProposalOutcome(
  eligibleVoterCount: number,
  threshold: number,
  votes: { vote: VoteChoice }[]
): ProposalOutcome {
  const totalVotes = votes.length;
  const yesCount = votes.filter((v) => v.vote === "yes").length;
  const noCount = votes.filter((v) => v.vote === "no").length;

  // Check quorum (D8)
  const participation = eligibleVoterCount > 0 ? totalVotes / eligibleVoterCount : 0;
  if (participation < threshold) {
    return "expired";
  }

  // Strict majority (D9): yes must be strictly greater than no
  if (yesCount > noCount) {
    return "passed";
  }

  return "failed";
}

// ---- Side effects for passed proposals ----

type Supabase = SupabaseClient<Database>;

interface ProposalData {
  id: string;
  household_id: string;
  type: string;
  target_member_id: string | null;
}

/**
 * Handle side effects when an "elect_admin" proposal passes.
 *
 * 1. Close current admin's admin_history record
 * 2. Demote current admin → role = "member"
 * 3. Promote target → role = "admin"
 * 4. Insert new admin_history record (reason = "elected")
 */
export async function handleElectAdmin(
  supabase: Supabase,
  proposal: ProposalData
): Promise<void> {
  if (!proposal.target_member_id) return;

  // Find the current admin
  const { data: currentAdmin } = await supabase
    .from("household_members")
    .select("id")
    .eq("household_id", proposal.household_id)
    .eq("role", "admin")
    .is("left_at", null)
    .single();

  if (currentAdmin) {
    // Close their admin_history record
    await supabase
      .from("admin_history")
      .update({ ended_at: new Date().toISOString() })
      .eq("household_id", proposal.household_id)
      .eq("member_id", currentAdmin.id)
      .is("ended_at", null);

    // Demote to member
    await supabase
      .from("household_members")
      .update({ role: "member" })
      .eq("id", currentAdmin.id);
  }

  // Promote target to admin
  await supabase
    .from("household_members")
    .update({ role: "admin" })
    .eq("id", proposal.target_member_id);

  // Insert new admin_history record
  await supabase.from("admin_history").insert({
    household_id: proposal.household_id,
    member_id: proposal.target_member_id,
    reason: "elected",
    proposal_id: proposal.id,
  });
}

/**
 * Handle side effects when a "remove_member" proposal passes.
 *
 * 1. Set left_at on target member
 * 2. Unassign their pending chores (D29)
 * 3. If target was admin → auto-promote longest-tenured member (D12)
 */
export async function handleRemoveMember(
  supabase: Supabase,
  proposal: ProposalData
): Promise<void> {
  if (!proposal.target_member_id) return;

  // Check if target is admin
  const { data: targetMember } = await supabase
    .from("household_members")
    .select("id, role")
    .eq("id", proposal.target_member_id)
    .single();

  const wasAdmin = targetMember?.role === "admin";

  // 1. Set left_at on target member
  await supabase
    .from("household_members")
    .update({ left_at: new Date().toISOString() })
    .eq("id", proposal.target_member_id);

  // 2. Unassign their pending chores (D29)
  await supabase
    .from("chore_instances")
    .update({ assigned_to: null })
    .eq("assigned_to", proposal.target_member_id)
    .eq("status", "pending");

  // 3. If target was admin, auto-promote (D12)
  if (wasAdmin) {
    // Close their admin_history record
    await supabase
      .from("admin_history")
      .update({ ended_at: new Date().toISOString() })
      .eq("household_id", proposal.household_id)
      .eq("member_id", proposal.target_member_id)
      .is("ended_at", null);

    // Find longest-tenured remaining active member (tiebreaker: smallest UUID)
    const { data: nextAdmin } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", proposal.household_id)
      .is("left_at", null)
      .neq("id", proposal.target_member_id)
      .order("joined_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .single();

    if (nextAdmin) {
      // Promote them
      await supabase
        .from("household_members")
        .update({ role: "admin" })
        .eq("id", nextAdmin.id);

      // Insert admin_history
      await supabase.from("admin_history").insert({
        household_id: proposal.household_id,
        member_id: nextAdmin.id,
        reason: "auto_promoted",
      });
    }
  }
}
