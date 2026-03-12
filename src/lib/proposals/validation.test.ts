import { describe, it, expect } from "vitest";
import {
  createProposalSchema,
  castVoteSchema,
  PROPOSAL_TYPES,
} from "./validation";
import { TEST_UUID } from "@/test/helpers";

describe("PROPOSAL_TYPES", () => {
  it("exports the three proposal types", () => {
    expect(PROPOSAL_TYPES).toEqual(["elect_admin", "remove_member", "custom"]);
  });
});

describe("createProposalSchema", () => {
  const validCustom = {
    type: "custom",
    title: "Should we adopt a pet?",
    description: "Let's discuss",
    durationHours: 48,
  };

  it("accepts valid custom proposal", () => {
    const result = createProposalSchema.safeParse(validCustom);
    expect(result.success).toBe(true);
  });

  it("accepts elect_admin with targetMemberId", () => {
    const result = createProposalSchema.safeParse({
      type: "elect_admin",
      title: "Elect new admin",
      targetMemberId: TEST_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("accepts remove_member with targetMemberId", () => {
    const result = createProposalSchema.safeParse({
      type: "remove_member",
      title: "Remove inactive member",
      targetMemberId: TEST_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects elect_admin without targetMemberId", () => {
    const result = createProposalSchema.safeParse({
      type: "elect_admin",
      title: "Elect someone",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Please select a target member"
      );
    }
  });

  it("rejects remove_member without targetMemberId", () => {
    const result = createProposalSchema.safeParse({
      type: "remove_member",
      title: "Remove someone",
    });
    expect(result.success).toBe(false);
  });

  it("does not require targetMemberId for custom", () => {
    const result = createProposalSchema.safeParse({
      type: "custom",
      title: "Custom vote",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createProposalSchema.safeParse({
      type: "custom",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = createProposalSchema.safeParse({
      type: "custom",
      title: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 chars", () => {
    const result = createProposalSchema.safeParse({
      type: "custom",
      title: "Valid title",
      description: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string description", () => {
    const result = createProposalSchema.safeParse({
      type: "custom",
      title: "Valid",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects durationHours < 1", () => {
    const result = createProposalSchema.safeParse({
      ...validCustom,
      durationHours: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects durationHours > 168", () => {
    const result = createProposalSchema.safeParse({
      ...validCustom,
      durationHours: 169,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid proposal type", () => {
    const result = createProposalSchema.safeParse({
      type: "invalid",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid targetMemberId uuid", () => {
    const result = createProposalSchema.safeParse({
      type: "elect_admin",
      title: "Elect",
      targetMemberId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("castVoteSchema", () => {
  it("accepts valid yes vote", () => {
    const result = castVoteSchema.safeParse({
      proposalId: TEST_UUID,
      vote: "yes",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid no vote", () => {
    const result = castVoteSchema.safeParse({
      proposalId: TEST_UUID,
      vote: "no",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid vote value", () => {
    const result = castVoteSchema.safeParse({
      proposalId: TEST_UUID,
      vote: "abstain",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid proposalId", () => {
    const result = castVoteSchema.safeParse({
      proposalId: "bad",
      vote: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing proposalId", () => {
    const result = castVoteSchema.safeParse({ vote: "yes" });
    expect(result.success).toBe(false);
  });

  it("rejects missing vote", () => {
    const result = castVoteSchema.safeParse({ proposalId: TEST_UUID });
    expect(result.success).toBe(false);
  });
});
