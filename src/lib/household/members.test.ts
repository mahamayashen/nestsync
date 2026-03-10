import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks ----
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { getHouseholdMembers } from "./members";

// ---- Chain helper ----
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  Object.defineProperty(chain, "then", {
    value: (resolve: (val: unknown) => void) =>
      Promise.resolve(result).then(resolve),
    writable: true,
    configurable: true,
  });
  return chain;
}

let mockSupa: { from: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
  mockSupa = {
    from: vi.fn().mockReturnValue(
      createChain({
        data: [
          {
            id: "m-001",
            user_id: "u-001",
            role: "admin",
            joined_at: "2025-01-01",
            users: {
              display_name: "Alice",
              avatar_url: null,
              email: "alice@example.com",
            },
          },
        ],
        error: null,
      })
    ),
  };
  mockCreateClient.mockResolvedValue(mockSupa);
});

describe("getHouseholdMembers", () => {
  it("returns members when data exists", async () => {
    const result = await getHouseholdMembers("household-001");
    expect(result).toHaveLength(1);
    expect(result[0].users.display_name).toBe("Alice");
  });

  it("returns empty array on error", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: { message: "Error" } })
    );
    const result = await getHouseholdMembers("household-001");
    expect(result).toEqual([]);
  });

  it("returns empty array when no data", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
    const result = await getHouseholdMembers("household-001");
    expect(result).toEqual([]);
  });

  it("queries household_members table", async () => {
    await getHouseholdMembers("household-001");
    expect(mockSupa.from).toHaveBeenCalledWith("household_members");
  });
});
