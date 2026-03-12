import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildFormData,
  mockMembership,
  createMockSupabase,
  TEST_UUID,
  TEST_UUID_2,
} from "@/test/helpers";

// ---- Hoisted mocks ----
const { mockGetCurrentMembership, mockCreateClient } = vi.hoisted(() => ({
  mockGetCurrentMembership: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/household/queries", () => ({
  getCurrentMembership: () => mockGetCurrentMembership(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { createProposal, castVote, expireProposals } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- createProposal ----
describe("createProposal", () => {
  it("returns error on invalid form data", async () => {
    const fd = buildFormData({ type: "custom", title: "" });
    const result = await createProposal(fd);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ type: "custom", title: "Test proposal", description: "", durationHours: "48" });
    const result = await createProposal(fd);
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error when household not found", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());
    const mockSupa = createMockSupabase({ data: null, error: null });
    mockCreateClient.mockResolvedValue(mockSupa);
    const fd = buildFormData({ type: "custom", title: "Test proposal", description: "", durationHours: "48" });
    const result = await createProposal(fd);
    expect(result.error).toBe("Household not found");
  });

  it("creates custom proposal successfully", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const householdChain = createMockSupabase({
      data: { min_vote_participation: 0.5, default_vote_duration_hours: 48 },
      error: null,
    });
    const countChain = createMockSupabase({
      data: null,
      error: null,
      count: 4,
    });
    const insertChain = createMockSupabase({ data: null, error: null });

    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "households") return householdChain._defaultChain;
        if (table === "household_members") return countChain._defaultChain;
        if (table === "proposals") return insertChain._defaultChain;
        return householdChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ type: "custom", title: "Should we get a pet?", description: "", durationHours: "48" });
    const result = await createProposal(fd);
    expect(result.success).toBe(true);
  });

  it("returns error for duplicate active admin election (D11)", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const householdChain = createMockSupabase({
      data: { min_vote_participation: 0.5, default_vote_duration_hours: 48 },
      error: null,
    });
    // Simulate existing active election
    const proposalChain = createMockSupabase({
      data: { id: "existing-election" },
      error: null,
    });

    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "households") return householdChain._defaultChain;
        if (table === "proposals") return proposalChain._defaultChain;
        return householdChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({
      type: "elect_admin",
      title: "Elect new admin",
      description: "",
      targetMemberId: TEST_UUID,
      durationHours: "48",
    });
    const result = await createProposal(fd);
    expect(result.error).toContain("already an active admin election");
  });

  it("returns error for elect_admin when target not found", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const householdChain = createMockSupabase({
      data: { min_vote_participation: 0.5, default_vote_duration_hours: 48 },
      error: null,
    });
    // No active election
    const noElectionChain = createMockSupabase({ data: null, error: null });
    // Target not found
    const targetChain = createMockSupabase({ data: null, error: null });

    let proposalCallCount = 0;
    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "households") return householdChain._defaultChain;
        if (table === "proposals") {
          proposalCallCount++;
          if (proposalCallCount === 1) return noElectionChain._defaultChain;
          return noElectionChain._defaultChain;
        }
        if (table === "household_members") return targetChain._defaultChain;
        return householdChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({
      type: "elect_admin",
      title: "Elect admin",
      description: "",
      targetMemberId: TEST_UUID,
      durationHours: "48",
    });
    const result = await createProposal(fd);
    expect(result.error).toBe("Target member not found");
  });

  it("returns error for elect_admin when target is already admin", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const householdChain = createMockSupabase({
      data: { min_vote_participation: 0.5, default_vote_duration_hours: 48 },
      error: null,
    });
    const noElectionChain = createMockSupabase({ data: null, error: null });
    const targetAdminChain = createMockSupabase({
      data: { id: TEST_UUID, role: "admin" },
      error: null,
    });

    let proposalCallCount = 0;
    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "households") return householdChain._defaultChain;
        if (table === "proposals") {
          proposalCallCount++;
          if (proposalCallCount === 1) return noElectionChain._defaultChain;
          return noElectionChain._defaultChain;
        }
        if (table === "household_members")
          return targetAdminChain._defaultChain;
        return householdChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({
      type: "elect_admin",
      title: "Elect admin",
      description: "",
      targetMemberId: TEST_UUID,
      durationHours: "48",
    });
    const result = await createProposal(fd);
    expect(result.error).toBe("This member is already the admin");
  });

  it("returns error for remove_member when target not found", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const householdChain = createMockSupabase({
      data: { min_vote_participation: 0.5, default_vote_duration_hours: 48 },
      error: null,
    });
    const targetChain = createMockSupabase({ data: null, error: null });

    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "households") return householdChain._defaultChain;
        if (table === "household_members") return targetChain._defaultChain;
        return householdChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({
      type: "remove_member",
      title: "Remove member",
      description: "",
      targetMemberId: TEST_UUID,
      durationHours: "48",
    });
    const result = await createProposal(fd);
    expect(result.error).toBe("Target member not found");
  });

  it("returns error on unique constraint violation (D11 fallback)", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const householdChain = createMockSupabase({
      data: { min_vote_participation: 0.5, default_vote_duration_hours: 48 },
      error: null,
    });
    const countChain = createMockSupabase({
      data: null,
      error: null,
      count: 4,
    });
    const insertErrorChain = createMockSupabase({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });

    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "households") return householdChain._defaultChain;
        if (table === "household_members") return countChain._defaultChain;
        if (table === "proposals") return insertErrorChain._defaultChain;
        return householdChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ type: "custom", title: "Test", description: "", durationHours: "48" });
    const result = await createProposal(fd);
    expect(result.error).toContain("already an active admin election");
  });

  it("returns generic error on non-unique insert failure", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const householdChain = createMockSupabase({
      data: { min_vote_participation: 0.5, default_vote_duration_hours: 48 },
      error: null,
    });
    const countChain = createMockSupabase({
      data: null,
      error: null,
      count: 4,
    });
    const insertErrorChain = createMockSupabase({
      data: null,
      error: { code: "42000", message: "other error" },
    });

    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "households") return householdChain._defaultChain;
        if (table === "household_members") return countChain._defaultChain;
        if (table === "proposals") return insertErrorChain._defaultChain;
        return householdChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ type: "custom", title: "Test", description: "", durationHours: "48" });
    const result = await createProposal(fd);
    expect(result.error).toBe("Failed to create proposal. Please try again.");
  });
});

// ---- castVote ----
describe("castVote", () => {
  it("returns error on invalid form data", async () => {
    const fd = buildFormData({ proposalId: "bad", vote: "maybe" });
    const result = await castVote(fd);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error when proposal not found", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());
    const mockSupa = createMockSupabase({ data: null, error: null });
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toBe("Proposal not found");
  });

  it("returns error when proposal is not active", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());
    const mockSupa = createMockSupabase({
      data: {
        id: TEST_UUID,
        status: "passed",
        household_id: "household-001",
        voting_deadline: new Date(Date.now() + 86400000).toISOString(),
        created_at: "2020-01-01T00:00:00Z",
        eligible_voter_count: 4,
      },
      error: null,
    });
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toBe("This proposal is no longer active");
  });

  it("returns error when voting deadline has passed", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());
    const mockSupa = createMockSupabase({
      data: {
        id: TEST_UUID,
        status: "active",
        household_id: "household-001",
        voting_deadline: "2020-01-01T00:00:00Z",
        created_at: "2019-01-01T00:00:00Z",
        eligible_voter_count: 4,
      },
      error: null,
    });
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toBe("The voting period has ended");
  });

  it("returns error when member joined after proposal (D30)", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const proposalData = {
      id: TEST_UUID,
      status: "active",
      household_id: "household-001",
      voting_deadline: new Date(Date.now() + 86400000).toISOString(),
      created_at: "2020-01-01T00:00:00Z",
      eligible_voter_count: 4,
    };
    const memberData = { joined_at: "2025-01-01T00:00:00Z" };

    let callCount = 0;
    const proposalChain = createMockSupabase({
      data: proposalData,
      error: null,
    });
    const memberChain = createMockSupabase({ data: memberData, error: null });

    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "proposals") return proposalChain._defaultChain;
        if (table === "household_members") return memberChain._defaultChain;
        return proposalChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toContain("joined after this proposal");
  });

  it("returns error when already voted", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const proposalData = {
      id: TEST_UUID,
      status: "active",
      household_id: "household-001",
      voting_deadline: new Date(Date.now() + 86400000).toISOString(),
      created_at: "2025-01-01T00:00:00Z",
      eligible_voter_count: 4,
    };
    const memberData = { joined_at: "2020-01-01T00:00:00Z" };
    const existingVote = { id: "vote-1" };

    const proposalChain = createMockSupabase({
      data: proposalData,
      error: null,
    });
    const memberChain = createMockSupabase({ data: memberData, error: null });
    const voteChain = createMockSupabase({ data: existingVote, error: null });

    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "proposals") return proposalChain._defaultChain;
        if (table === "household_members") return memberChain._defaultChain;
        if (table === "votes") return voteChain._defaultChain;
        return proposalChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toBe("You have already voted on this proposal");
  });

  it("casts vote successfully", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const proposalData = {
      id: TEST_UUID,
      status: "active",
      household_id: "household-001",
      voting_deadline: new Date(Date.now() + 86400000).toISOString(),
      created_at: "2025-01-01T00:00:00Z",
      eligible_voter_count: 10,
    };
    const memberData = { joined_at: "2020-01-01T00:00:00Z" };

    const proposalChain = createMockSupabase({
      data: proposalData,
      error: null,
    });
    const memberChain = createMockSupabase({ data: memberData, error: null });
    // No existing vote, insert succeeds, count < eligible
    const noVoteChain = createMockSupabase({ data: null, error: null });
    const insertChain = createMockSupabase({ data: null, error: null });
    const countChain = createMockSupabase({
      data: null,
      error: null,
      count: 3,
    });

    let voteCallCount = 0;
    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "proposals") return proposalChain._defaultChain;
        if (table === "household_members") return memberChain._defaultChain;
        if (table === "votes") {
          voteCallCount++;
          if (voteCallCount === 1) return noVoteChain._defaultChain; // check existing
          if (voteCallCount === 2) return insertChain._defaultChain; // insert
          return countChain._defaultChain; // count
        }
        return proposalChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.success).toBe(true);
  });

  it("returns error on unique constraint vote failure", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const proposalData = {
      id: TEST_UUID,
      status: "active",
      household_id: "household-001",
      voting_deadline: new Date(Date.now() + 86400000).toISOString(),
      created_at: "2025-01-01T00:00:00Z",
      eligible_voter_count: 4,
    };
    const memberData = { joined_at: "2020-01-01T00:00:00Z" };
    const noVoteChain = createMockSupabase({ data: null, error: null });
    const insertErrorChain = createMockSupabase({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });

    const proposalChain = createMockSupabase({
      data: proposalData,
      error: null,
    });
    const memberChain = createMockSupabase({ data: memberData, error: null });

    let voteCallCount = 0;
    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "proposals") return proposalChain._defaultChain;
        if (table === "household_members") return memberChain._defaultChain;
        if (table === "votes") {
          voteCallCount++;
          if (voteCallCount === 1) return noVoteChain._defaultChain;
          return insertErrorChain._defaultChain;
        }
        return proposalChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toBe("You have already voted on this proposal");
  });

  it("returns generic error on non-unique vote insert failure", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());

    const proposalData = {
      id: TEST_UUID,
      status: "active",
      household_id: "household-001",
      voting_deadline: new Date(Date.now() + 86400000).toISOString(),
      created_at: "2025-01-01T00:00:00Z",
      eligible_voter_count: 4,
    };
    const memberData = { joined_at: "2020-01-01T00:00:00Z" };
    const noVoteChain = createMockSupabase({ data: null, error: null });
    const insertErrorChain = createMockSupabase({
      data: null,
      error: { code: "42000", message: "other error" },
    });

    const proposalChain = createMockSupabase({
      data: proposalData,
      error: null,
    });
    const memberChain = createMockSupabase({ data: memberData, error: null });

    let voteCallCount = 0;
    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "proposals") return proposalChain._defaultChain;
        if (table === "household_members") return memberChain._defaultChain;
        if (table === "votes") {
          voteCallCount++;
          if (voteCallCount === 1) return noVoteChain._defaultChain;
          return insertErrorChain._defaultChain;
        }
        return proposalChain._defaultChain;
      }),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const fd = buildFormData({ proposalId: TEST_UUID, vote: "yes" });
    const result = await castVote(fd);
    expect(result.error).toBe("Failed to cast vote. Please try again.");
  });
});

// ---- expireProposals ----
describe("expireProposals", () => {
  it("returns early when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    await expireProposals();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("does nothing when no overdue proposals", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());
    const mockSupa = createMockSupabase({ data: [], error: null });
    mockCreateClient.mockResolvedValue(mockSupa);

    await expireProposals();
    // Should not throw
  });

  it("does nothing when overdue proposals is null", async () => {
    mockGetCurrentMembership.mockResolvedValue(mockMembership());
    const mockSupa = createMockSupabase({ data: null, error: null });
    mockCreateClient.mockResolvedValue(mockSupa);

    await expireProposals();
    // Should not throw
  });
});
