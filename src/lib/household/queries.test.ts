import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks ----
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { getCurrentMembership } from "./queries";

// ---- Chain helper ----
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  Object.defineProperty(chain, "then", {
    value: (resolve: (val: unknown) => void) =>
      Promise.resolve(result).then(resolve),
    writable: true,
    configurable: true,
  });
  return chain;
}

let mockSupa: {
  from: ReturnType<typeof vi.fn>;
  auth: { getUser: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSupa = {
    from: vi.fn().mockReturnValue(
      createChain({
        data: { id: "member-001", household_id: "household-001", role: "admin" },
        error: null,
      })
    ),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-001" } },
        error: null,
      }),
    },
  };
  mockCreateClient.mockResolvedValue(mockSupa);
});

describe("getCurrentMembership", () => {
  it("returns membership when user is authenticated and in a household", async () => {
    const result = await getCurrentMembership();
    expect(result).toEqual({
      memberId: "member-001",
      householdId: "household-001",
      userId: "user-001",
      role: "admin",
    });
  });

  it("returns null when not authenticated", async () => {
    mockSupa.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const result = await getCurrentMembership();
    expect(result).toBeNull();
  });

  it("returns null when no household membership", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
    const result = await getCurrentMembership();
    expect(result).toBeNull();
  });

  it("queries household_members with correct filters", async () => {
    await getCurrentMembership();
    expect(mockSupa.from).toHaveBeenCalledWith("household_members");
  });

  it("returns member role from database", async () => {
    mockSupa.from.mockReturnValue(
      createChain({
        data: { id: "m-002", household_id: "h-002", role: "member" },
        error: null,
      })
    );
    const result = await getCurrentMembership();
    expect(result?.role).toBe("member");
  });
});
