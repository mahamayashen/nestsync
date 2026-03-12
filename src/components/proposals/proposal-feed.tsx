"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scales, CaretDown, CaretUp } from "@phosphor-icons/react";
import { useSupabase } from "@/hooks/use-supabase";
import type { ProposalWithDetails } from "@/lib/proposals/queries";
import type { HouseholdMemberWithUser } from "@/lib/household/members";
import { ProposalCard } from "./proposal-card";
import { CreateProposalForm } from "./create-proposal-form";

interface ProposalFeedProps {
  initialProposals: ProposalWithDetails[];
  householdId: string;
  currentMemberId: string;
  currentMemberJoinedAt: string;
  currentMemberRole: "admin" | "member";
  members: HouseholdMemberWithUser[];
}

export function ProposalFeed({
  initialProposals,
  householdId,
  currentMemberId,
  currentMemberJoinedAt,
  currentMemberRole,
  members,
}: ProposalFeedProps) {
  const supabase = useSupabase();
  const [showPast, setShowPast] = useState(false);

  const { data: proposals } = useQuery({
    queryKey: ["proposals", householdId],
    queryFn: async () => {
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
    },
    initialData: initialProposals,
    staleTime: 0,
  });

  const activeProposals = proposals.filter((p) => p.status === "active");
  const pastProposals = proposals.filter((p) => p.status !== "active");

  return (
    <div className="space-y-6">
      {/* Create button */}
      <CreateProposalForm
        householdId={householdId}
        members={members}
        currentMemberRole={currentMemberRole}
      />

      {/* Active Proposals */}
      {activeProposals.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Scales className="w-4 h-4 text-primary" />
            Active Proposals ({activeProposals.length})
          </h2>
          {activeProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              currentMemberId={currentMemberId}
              currentMemberJoinedAt={currentMemberJoinedAt}
              householdId={householdId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Scales className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-secondary font-medium">
            No active proposals
          </p>
          <p className="text-sm text-text-muted mt-1">
            Create a proposal to start a household vote
          </p>
        </div>
      )}

      {/* Past Proposals (collapsible) */}
      {pastProposals.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {showPast ? (
              <CaretUp className="w-4 h-4" />
            ) : (
              <CaretDown className="w-4 h-4" />
            )}
            Past Proposals ({pastProposals.length})
          </button>

          {showPast && (
            <div className="space-y-3 mt-3">
              {pastProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  currentMemberId={currentMemberId}
                  currentMemberJoinedAt={currentMemberJoinedAt}
                  householdId={householdId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
