"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  UserMinus,
  Scales,
  Timer,
  CheckCircle,
  XCircle,
  SpinnerGap,
  Check,
} from "@phosphor-icons/react";
import { castVote } from "@/lib/proposals/actions";
import { VoteProgressBar } from "./vote-progress-bar";
import type { ProposalWithDetails } from "@/lib/proposals/queries";

interface ProposalCardProps {
  proposal: ProposalWithDetails;
  currentMemberId: string;
  currentMemberJoinedAt: string;
  householdId: string;
}

// Type badge config
const TYPE_CONFIG = {
  elect_admin: {
    label: "Admin Election",
    icon: Crown,
    bg: "bg-accent-light",
    text: "text-accent",
    border: "border-accent/15",
  },
  remove_member: {
    label: "Remove Member",
    icon: UserMinus,
    bg: "bg-highlight-light",
    text: "text-highlight",
    border: "border-highlight/15",
  },
  custom: {
    label: "Custom Vote",
    icon: Scales,
    bg: "bg-primary-light",
    text: "text-primary",
    border: "border-primary/15",
  },
} as const;

// Status badge config
const STATUS_CONFIG = {
  active: { label: "Active", bg: "bg-primary-light", text: "text-primary" },
  passed: { label: "Passed", bg: "bg-success/10", text: "text-success" },
  failed: { label: "Failed", bg: "bg-error-light", text: "text-error" },
  expired: {
    label: "Expired",
    bg: "bg-surface-secondary",
    text: "text-text-muted",
  },
} as const;

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function useCountdown(deadline: string, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!isActive) return;

    function update() {
      const now = Date.now();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Voting ended");
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s left`);
      } else {
        setTimeLeft(`${seconds}s left`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline, isActive]);

  return timeLeft;
}

export function ProposalCard({
  proposal,
  currentMemberId,
  currentMemberJoinedAt,
  householdId,
}: ProposalCardProps) {
  const queryClient = useQueryClient();
  const isActive = proposal.status === "active";
  const countdown = useCountdown(proposal.voting_deadline, isActive);

  const typeConfig = TYPE_CONFIG[proposal.type];
  const statusConfig = STATUS_CONFIG[proposal.status];
  const TypeIcon = typeConfig.icon;

  // Vote counts
  const yesCount = proposal.votes.filter((v) => v.vote === "yes").length;
  const noCount = proposal.votes.filter((v) => v.vote === "no").length;

  // Current user's vote
  const myVote = proposal.votes.find(
    (v) => v.member_id === currentMemberId
  )?.vote;

  // Can the current user vote?
  const joinedAfterProposal =
    new Date(currentMemberJoinedAt) >= new Date(proposal.created_at);
  const deadlinePassed = new Date(proposal.voting_deadline) <= new Date();
  const canVote = isActive && !myVote && !joinedAfterProposal && !deadlinePassed;

  const voteMutation = useMutation({
    mutationFn: async (vote: "yes" | "no") => {
      const formData = new FormData();
      formData.set("proposalId", proposal.id);
      formData.set("vote", vote);
      return castVote(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["proposals", householdId],
        });
      }
    },
  });

  const voteError = voteMutation.data?.error;

  return (
    <div
      className={`bg-white/60 backdrop-blur-sm rounded-xl border ${
        isActive ? typeConfig.border : "border-border-light"
      } p-5 shadow-sm`}
    >
      {/* Top row: type badge + status + time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}
          >
            <TypeIcon className="w-3.5 h-3.5" weight="fill" />
            {typeConfig.label}
          </span>
          {!isActive && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
            >
              {proposal.status === "passed" && (
                <CheckCircle className="w-3 h-3" weight="fill" />
              )}
              {proposal.status === "failed" && (
                <XCircle className="w-3 h-3" weight="fill" />
              )}
              {statusConfig.label}
            </span>
          )}
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Timer className="w-3.5 h-3.5" />
            {countdown}
          </span>
        )}
      </div>

      {/* Title + description */}
      <h3 className="text-sm font-semibold text-text-primary">
        {proposal.title}
      </h3>
      {proposal.description && (
        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
          {proposal.description}
        </p>
      )}

      {/* Target member (if applicable) */}
      {proposal.target_member && (
        <p className="text-xs text-text-muted mt-2">
          {proposal.type === "elect_admin" ? "Nominee: " : "Subject: "}
          <span className="font-medium text-text-secondary">
            {proposal.target_member.users.display_name}
          </span>
        </p>
      )}

      {/* Meta: creator + time */}
      <p className="text-xs text-text-muted mt-2">
        Proposed by {proposal.creator.users.display_name}{" "}
        {formatRelativeTime(proposal.created_at)}
      </p>

      {/* Vote progress bar */}
      <div className="mt-4">
        <VoteProgressBar
          yesCount={yesCount}
          noCount={noCount}
          eligibleVoterCount={proposal.eligible_voter_count}
          participationThreshold={proposal.min_participation_threshold}
        />
      </div>

      {/* Vote actions (only for active proposals) */}
      {isActive && (
        <div className="mt-4">
          {voteError && (
            <p className="text-xs text-error-text bg-error-light px-3 py-1.5 rounded-lg mb-2">
              {voteError}
            </p>
          )}

          {myVote ? (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Check className="w-4 h-4 text-success" weight="bold" />
              You voted{" "}
              <span
                className={`font-medium ${
                  myVote === "yes" ? "text-success" : "text-error"
                }`}
              >
                {myVote === "yes" ? "Yes" : "No"}
              </span>
            </div>
          ) : joinedAfterProposal ? (
            <p className="text-xs text-text-muted italic">
              You joined after this proposal was created
            </p>
          ) : deadlinePassed ? (
            <p className="text-xs text-text-muted italic">
              The voting period has ended
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => voteMutation.mutate("yes")}
                disabled={voteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {voteMutation.isPending ? (
                  <SpinnerGap className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" weight="fill" />
                )}
                Yes
              </button>
              <button
                onClick={() => voteMutation.mutate("no")}
                disabled={voteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-error bg-error-light hover:bg-error/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {voteMutation.isPending ? (
                  <SpinnerGap className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" weight="fill" />
                )}
                No
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
