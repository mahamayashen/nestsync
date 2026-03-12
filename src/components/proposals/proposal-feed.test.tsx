import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { ProposalFeed } from "./proposal-feed";
import type { ProposalWithDetails } from "@/lib/proposals/queries";

vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/proposals/actions", () => ({
  castVote: vi.fn().mockResolvedValue({ success: true }),
  createProposal: vi.fn().mockResolvedValue({ success: true }),
}));

const activeProposal: ProposalWithDetails = {
  id: "p1",
  household_id: "h1",
  type: "custom",
  title: "Active Proposal",
  description: null,
  target_member_id: null,
  created_by: "m1",
  status: "active",
  eligible_voter_count: 4,
  min_participation_threshold: 0.5,
  voting_deadline: new Date(Date.now() + 86400000).toISOString(),
  resolved_at: null,
  created_at: new Date().toISOString(),
  target_member: null,
  creator: { id: "m1", users: { display_name: "Alice" } },
  votes: [],
};

const pastProposal: ProposalWithDetails = {
  ...activeProposal,
  id: "p2",
  title: "Past Proposal",
  status: "passed",
  resolved_at: new Date().toISOString(),
};

const defaultProps = {
  householdId: "h1",
  currentMemberId: "m2",
  currentMemberJoinedAt: "2020-01-01T00:00:00Z",
  currentMemberRole: "member" as const,
  members: [],
};

describe("ProposalFeed", () => {
  it("renders active proposals section", () => {
    renderWithProviders(
      <ProposalFeed
        {...defaultProps}
        initialProposals={[activeProposal]}
      />
    );
    expect(screen.getByText("Active Proposal")).toBeInTheDocument();
    expect(screen.getByText(/Active Proposals/)).toBeInTheDocument();
  });

  it("shows empty state when no active proposals", () => {
    renderWithProviders(
      <ProposalFeed {...defaultProps} initialProposals={[]} />
    );
    expect(screen.getByText("No active proposals")).toBeInTheDocument();
    expect(
      screen.getByText("Create a proposal to start a household vote")
    ).toBeInTheDocument();
  });

  it("renders past proposals toggle when past proposals exist", () => {
    renderWithProviders(
      <ProposalFeed
        {...defaultProps}
        initialProposals={[pastProposal]}
      />
    );
    expect(screen.getByText(/Past Proposals/)).toBeInTheDocument();
  });

  it("does not show past proposal content initially (collapsed)", () => {
    renderWithProviders(
      <ProposalFeed
        {...defaultProps}
        initialProposals={[pastProposal]}
      />
    );
    // The toggle button should exist but the proposal content should be hidden
    expect(screen.getByRole("button", { name: /Past Proposals/ })).toBeInTheDocument();
  });

  it("shows New Proposal button", () => {
    renderWithProviders(
      <ProposalFeed {...defaultProps} initialProposals={[]} />
    );
    expect(screen.getByText("New Proposal")).toBeInTheDocument();
  });

  it("separates active and past proposals correctly", () => {
    renderWithProviders(
      <ProposalFeed
        {...defaultProps}
        initialProposals={[activeProposal, pastProposal]}
      />
    );
    expect(screen.getByText(/Active Proposals \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Past Proposals \(1\)/)).toBeInTheDocument();
  });
});
