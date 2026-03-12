import { describe, it, expect, vi } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { getProposals } from "./queries";
import { createMockSupabase } from "@/test/helpers";

describe("getProposals", () => {
  it("returns proposals for a household", async () => {
    const proposals = [
      { id: "p1", title: "Test proposal", status: "active" },
      { id: "p2", title: "Old proposal", status: "passed" },
    ];
    const mockSupa = createMockSupabase({ data: proposals, error: null });
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getProposals("household-001");
    expect(result).toEqual(proposals);
  });

  it("returns empty array on error", async () => {
    const mockSupa = createMockSupabase({
      data: null,
      error: { message: "DB error" },
    });
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getProposals("household-001");
    expect(result).toEqual([]);
  });

  it("calls supabase with correct household id", async () => {
    const mockSupa = createMockSupabase({ data: [], error: null });
    mockCreateClient.mockResolvedValue(mockSupa);

    await getProposals("my-household");
    expect(mockSupa.from).toHaveBeenCalledWith("proposals");
    expect(mockSupa._defaultChain.eq).toHaveBeenCalledWith(
      "household_id",
      "my-household"
    );
  });
});
