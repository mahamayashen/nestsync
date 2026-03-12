import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import { ProposalCard } from "./proposal-card";
import type { ProposalWithDetails } from "@/lib/proposals/queries";

vi.mock("@/lib/proposals/actions", () => ({
  castVote: vi.fn().mockResolvedValue({ success: true }),
}));

const baseProposal: ProposalWithDetails = {
  id: "proposal-1",
  household_id: "household-1",
  type: "custom",
  title: "Should we get a dog?",
  description: "Let's discuss getting a household pet.",
  target_member_id: null,
  created_by: "member-1",
  status: "active",
  eligible_voter_count: 4,
  min_participation_threshold: 0.5,
  voting_deadline: new Date(Date.now() + 86400000).toISOString(),
  resolved_at: null,
  created_at: new Date(Date.now() - 3600000).toISOString(),
  target_member: null,
  creator: { id: "member-1", users: { display_name: "Alice" } },
  votes: [],
};

describe("ProposalCard", () => {
  it("renders proposal title and description", () => {
    renderWithProviders(
      <ProposalCard
        proposal={baseProposal}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Should we get a dog?")).toBeInTheDocument();
    expect(
      screen.getByText("Let's discuss getting a household pet.")
    ).toBeInTheDocument();
  });

  it("shows type badge for custom vote", () => {
    renderWithProviders(
      <ProposalCard
        proposal={baseProposal}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Custom Vote")).toBeInTheDocument();
  });

  it("shows Admin Election badge for elect_admin", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{
          ...baseProposal,
          type: "elect_admin",
          target_member: {
            id: "member-3",
            users: { display_name: "Bob" },
          },
        }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Admin Election")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows Remove Member badge", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{
          ...baseProposal,
          type: "remove_member",
          target_member: {
            id: "member-3",
            users: { display_name: "Charlie" },
          },
        }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Remove Member")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("shows creator name", () => {
    renderWithProviders(
      <ProposalCard
        proposal={baseProposal}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText(/Proposed by Alice/)).toBeInTheDocument();
  });

  it("shows Yes/No vote buttons when user can vote", () => {
    renderWithProviders(
      <ProposalCard
        proposal={baseProposal}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("shows 'You voted' message when user already voted", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{
          ...baseProposal,
          votes: [
            {
              id: "v1",
              member_id: "member-2",
              vote: "yes",
              voted_at: new Date().toISOString(),
            },
          ],
        }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText(/You voted/)).toBeInTheDocument();
  });

  it("shows message when user joined after proposal", () => {
    renderWithProviders(
      <ProposalCard
        proposal={baseProposal}
        currentMemberId="member-2"
        currentMemberJoinedAt={new Date(Date.now() + 86400000).toISOString()}
        householdId="household-1"
      />
    );
    expect(
      screen.getByText("You joined after this proposal was created")
    ).toBeInTheDocument();
  });

  it("shows status badge for passed proposals", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{ ...baseProposal, status: "passed" }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Passed")).toBeInTheDocument();
  });

  it("shows status badge for failed proposals", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{ ...baseProposal, status: "failed" }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows status badge for expired proposals", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{ ...baseProposal, status: "expired" }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("shows voting ended message when deadline passed", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{
          ...baseProposal,
          voting_deadline: "2020-01-01T00:00:00Z",
        }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2019-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(
      screen.getByText("The voting period has ended")
    ).toBeInTheDocument();
  });

  it("renders vote progress bar", () => {
    renderWithProviders(
      <ProposalCard
        proposal={{
          ...baseProposal,
          votes: [
            {
              id: "v1",
              member_id: "m1",
              vote: "yes",
              voted_at: new Date().toISOString(),
            },
            {
              id: "v2",
              member_id: "m2",
              vote: "no",
              voted_at: new Date().toISOString(),
            },
          ],
        }}
        currentMemberId="member-2"
        currentMemberJoinedAt="2020-01-01T00:00:00Z"
        householdId="household-1"
      />
    );
    expect(screen.getByText("1 Yes")).toBeInTheDocument();
    expect(screen.getByText("1 No")).toBeInTheDocument();
  });
});
