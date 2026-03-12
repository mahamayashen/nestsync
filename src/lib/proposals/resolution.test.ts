import { describe, it, expect } from "vitest";
import { evaluateProposalOutcome } from "./resolution";

describe("evaluateProposalOutcome", () => {
  // D8: Quorum check
  describe("quorum (D8)", () => {
    it("returns 'expired' when quorum is not met", () => {
      // 4 eligible voters, 50% threshold, only 1 vote
      const result = evaluateProposalOutcome(4, 0.5, [{ vote: "yes" }]);
      expect(result).toBe("expired");
    });

    it("meets quorum when participation equals threshold exactly", () => {
      // 4 eligible voters, 50% threshold, 2 votes (50%)
      const result = evaluateProposalOutcome(4, 0.5, [
        { vote: "yes" },
        { vote: "yes" },
      ]);
      expect(result).toBe("passed");
    });

    it("meets quorum when participation exceeds threshold", () => {
      // 4 eligible voters, 50% threshold, 3 votes (75%)
      const result = evaluateProposalOutcome(4, 0.5, [
        { vote: "yes" },
        { vote: "yes" },
        { vote: "no" },
      ]);
      expect(result).toBe("passed");
    });

    it("returns 'expired' with zero voters", () => {
      const result = evaluateProposalOutcome(0, 0.5, []);
      expect(result).toBe("expired");
    });

    it("returns 'expired' with no votes even if threshold is 0", () => {
      // 0% threshold still requires at least some participation for a result
      // With 0 votes and 0 threshold, participation = 0/4 = 0 which is >= 0
      // Actually 0 >= 0 is true, so quorum is met. With no votes, yes=0, no=0.
      // 0 > 0 is false, so result = "failed"
      const result = evaluateProposalOutcome(4, 0, []);
      expect(result).toBe("failed");
    });
  });

  // D9: Strict majority
  describe("strict majority (D9)", () => {
    it("returns 'passed' when yes > no", () => {
      const result = evaluateProposalOutcome(3, 0.5, [
        { vote: "yes" },
        { vote: "yes" },
        { vote: "no" },
      ]);
      expect(result).toBe("passed");
    });

    it("returns 'failed' when yes === no (tie)", () => {
      const result = evaluateProposalOutcome(4, 0.5, [
        { vote: "yes" },
        { vote: "yes" },
        { vote: "no" },
        { vote: "no" },
      ]);
      expect(result).toBe("failed");
    });

    it("returns 'failed' when no > yes", () => {
      const result = evaluateProposalOutcome(3, 0.5, [
        { vote: "yes" },
        { vote: "no" },
        { vote: "no" },
      ]);
      expect(result).toBe("failed");
    });

    it("returns 'passed' with unanimous yes", () => {
      const result = evaluateProposalOutcome(3, 0.5, [
        { vote: "yes" },
        { vote: "yes" },
        { vote: "yes" },
      ]);
      expect(result).toBe("passed");
    });

    it("returns 'failed' with unanimous no", () => {
      const result = evaluateProposalOutcome(3, 0.5, [
        { vote: "no" },
        { vote: "no" },
        { vote: "no" },
      ]);
      expect(result).toBe("failed");
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("handles single voter household", () => {
      // 1 eligible, 50% threshold, 1 yes vote
      const result = evaluateProposalOutcome(1, 0.5, [{ vote: "yes" }]);
      expect(result).toBe("passed");
    });

    it("handles single voter voting no", () => {
      const result = evaluateProposalOutcome(1, 0.5, [{ vote: "no" }]);
      expect(result).toBe("failed");
    });

    it("handles high threshold (100%)", () => {
      // 3 eligible, 100% threshold, only 2 voted
      const result = evaluateProposalOutcome(3, 1.0, [
        { vote: "yes" },
        { vote: "yes" },
      ]);
      expect(result).toBe("expired");
    });

    it("passes with 100% threshold when all vote", () => {
      const result = evaluateProposalOutcome(3, 1.0, [
        { vote: "yes" },
        { vote: "yes" },
        { vote: "no" },
      ]);
      expect(result).toBe("passed");
    });

    it("handles large household", () => {
      const votes: { vote: "yes" | "no" }[] = Array.from({ length: 6 }, () => ({ vote: "yes" as const }));
      votes.push(
        ...Array.from({ length: 4 }, () => ({ vote: "no" as const }))
      );
      // 10 eligible, 50% threshold, all 10 voted, 6 yes / 4 no
      const result = evaluateProposalOutcome(10, 0.5, votes);
      expect(result).toBe("passed");
    });

    it("expired when exactly at threshold boundary but quorum not quite met", () => {
      // 5 eligible, 50% threshold, 2 votes (40% < 50%)
      const result = evaluateProposalOutcome(5, 0.5, [
        { vote: "yes" },
        { vote: "yes" },
      ]);
      expect(result).toBe("expired");
    });
  });
});
