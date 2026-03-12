"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/household/queries";
import { createProposalSchema, castVoteSchema } from "./validation";
import {
  evaluateProposalOutcome,
  handleElectAdmin,
  handleRemoveMember,
} from "./resolution";

type ActionResult = { error?: string; success?: boolean };

// ---- CREATE PROPOSAL ----
export async function createProposal(
  formData: FormData
): Promise<ActionResult> {
  const parsed = createProposalSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    targetMemberId: formData.get("targetMemberId") || null,
    durationHours: formData.get("durationHours") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  // Fetch household config
  const { data: household } = await supabase
    .from("households")
    .select("min_vote_participation, default_vote_duration_hours")
    .eq("id", membership.householdId)
    .single();

  if (!household) return { error: "Household not found" };

  // D11: Only one active admin election at a time
  if (parsed.data.type === "elect_admin") {
    const { data: activeElection } = await supabase
      .from("proposals")
      .select("id")
      .eq("household_id", membership.householdId)
      .eq("type", "elect_admin")
      .eq("status", "active")
      .maybeSingle();

    if (activeElection) {
      return {
        error: "There is already an active admin election. Please wait for it to resolve.",
      };
    }
  }

  // Validate target member for elect_admin and remove_member
  if (parsed.data.type === "elect_admin" && parsed.data.targetMemberId) {
    const { data: target } = await supabase
      .from("household_members")
      .select("id, role")
      .eq("id", parsed.data.targetMemberId)
      .eq("household_id", membership.householdId)
      .is("left_at", null)
      .single();

    if (!target) return { error: "Target member not found" };
    if (target.role === "admin") {
      return { error: "This member is already the admin" };
    }
  }

  if (parsed.data.type === "remove_member" && parsed.data.targetMemberId) {
    const { data: target } = await supabase
      .from("household_members")
      .select("id")
      .eq("id", parsed.data.targetMemberId)
      .eq("household_id", membership.householdId)
      .is("left_at", null)
      .single();

    if (!target) return { error: "Target member not found" };
  }

  // Snapshot eligible voter count (active members)
  const { count: eligibleCount } = await supabase
    .from("household_members")
    .select("id", { count: "exact", head: true })
    .eq("household_id", membership.householdId)
    .is("left_at", null);

  const eligibleVoterCount = eligibleCount ?? 1;

  // Compute voting deadline
  const durationHours =
    parsed.data.durationHours ?? household.default_vote_duration_hours;
  const deadline = new Date(
    Date.now() + durationHours * 60 * 60 * 1000
  ).toISOString();

  // Insert proposal
  const { error: insertError } = await supabase.from("proposals").insert({
    household_id: membership.householdId,
    type: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description || null,
    target_member_id: parsed.data.targetMemberId ?? null,
    created_by: membership.memberId,
    eligible_voter_count: eligibleVoterCount,
    min_participation_threshold: household.min_vote_participation,
    voting_deadline: deadline,
  });

  if (insertError) {
    // D11 enforcement via partial unique index
    if (insertError.code === "23505") {
      return {
        error:
          "There is already an active admin election. Please wait for it to resolve.",
      };
    }
    return { error: "Failed to create proposal. Please try again." };
  }

  return { success: true };
}

// ---- CAST VOTE ----
export async function castVote(formData: FormData): Promise<ActionResult> {
  const parsed = castVoteSchema.safeParse({
    proposalId: formData.get("proposalId"),
    vote: formData.get("vote"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  // Fetch proposal
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", parsed.data.proposalId)
    .eq("household_id", membership.householdId)
    .single();

  if (!proposal) return { error: "Proposal not found" };
  if (proposal.status !== "active") {
    return { error: "This proposal is no longer active" };
  }

  // Check deadline
  if (new Date(proposal.voting_deadline) <= new Date()) {
    return { error: "The voting period has ended" };
  }

  // D30: Members who joined after proposal creation cannot vote
  const { data: member } = await supabase
    .from("household_members")
    .select("joined_at")
    .eq("id", membership.memberId)
    .single();

  if (member && new Date(member.joined_at) >= new Date(proposal.created_at)) {
    return {
      error: "You joined after this proposal was created and cannot vote on it",
    };
  }

  // Check if already voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("proposal_id", parsed.data.proposalId)
    .eq("member_id", membership.memberId)
    .maybeSingle();

  if (existingVote) {
    return { error: "You have already voted on this proposal" };
  }

  // Insert vote
  const { error: voteError } = await supabase.from("votes").insert({
    proposal_id: parsed.data.proposalId,
    member_id: membership.memberId,
    vote: parsed.data.vote,
  });

  if (voteError) {
    // Unique constraint violation
    if (voteError.code === "23505") {
      return { error: "You have already voted on this proposal" };
    }
    return { error: "Failed to cast vote. Please try again." };
  }

  // Early resolution: if all eligible voters have voted
  const { count: voteCount } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("proposal_id", parsed.data.proposalId);

  if (voteCount && voteCount >= proposal.eligible_voter_count) {
    await resolveProposal(parsed.data.proposalId);
  }

  return { success: true };
}

// ---- RESOLVE PROPOSAL (internal) ----
async function resolveProposal(proposalId: string): Promise<void> {
  const supabase = await createClient();

  // Fetch proposal (guard: must still be active)
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("status", "active")
    .single();

  if (!proposal) return; // Already resolved by concurrent request

  // Fetch all votes
  const { data: votes } = await supabase
    .from("votes")
    .select("vote")
    .eq("proposal_id", proposalId);

  if (!votes) return;

  // Evaluate outcome
  const outcome = evaluateProposalOutcome(
    proposal.eligible_voter_count,
    proposal.min_participation_threshold,
    votes as { vote: "yes" | "no" }[]
  );

  // Update proposal status (race-condition guard: only update if still active)
  const { data: updated } = await supabase
    .from("proposals")
    .update({
      status: outcome,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", proposalId)
    .eq("status", "active")
    .select("id")
    .single();

  // If no rows updated, another request already resolved it
  if (!updated) return;

  // Execute side effects if passed
  if (outcome === "passed") {
    if (proposal.type === "elect_admin") {
      await handleElectAdmin(supabase, proposal);
    } else if (proposal.type === "remove_member") {
      await handleRemoveMember(supabase, proposal);
    }
  }
}

// ---- EXPIRE PROPOSALS (called on page load) ----
export async function expireProposals(): Promise<void> {
  const membership = await getCurrentMembership();
  if (!membership) return;

  const supabase = await createClient();

  // Find all overdue active proposals in this household
  const { data: overdueProposals } = await supabase
    .from("proposals")
    .select("id")
    .eq("household_id", membership.householdId)
    .eq("status", "active")
    .lte("voting_deadline", new Date().toISOString());

  if (!overdueProposals || overdueProposals.length === 0) return;

  // Resolve each one
  for (const p of overdueProposals) {
    await resolveProposal(p.id);
  }
}
