import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient, mockGetHouseholdMembers } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockGetHouseholdMembers: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/household/members", () => ({
  getHouseholdMembers: (...args: unknown[]) =>
    mockGetHouseholdMembers(...args),
}));

import { getCalendarEvents } from "./queries";

function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  Object.defineProperty(chain, "then", {
    value: (resolve: (val: unknown) => void) =>
      Promise.resolve(result).then(resolve),
    writable: true,
    configurable: true,
  });
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetHouseholdMembers.mockResolvedValue([
    { id: "m-001", users: { display_name: "Alice" } },
    { id: "m-002", users: { display_name: "Bob" } },
  ]);
});

describe("getCalendarEvents", () => {
  it("returns events with member names resolved", async () => {
    const rawEvents = [
      {
        event_id: "e-001",
        household_id: "h-001",
        event_type: "chore",
        event_title: "Vacuum",
        event_date: "2026-03-10",
        event_status: "pending",
        related_member_id: "m-001",
        metadata_int: 3,
        metadata_decimal: null,
      },
    ];
    const mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: rawEvents, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCalendarEvents("h-001", "2026-03-09", "2026-03-15");
    expect(result).toHaveLength(1);
    expect(result[0].event_title).toBe("Vacuum");
    expect(result[0].member_display_name).toBe("Alice");
  });

  it("returns null member name for unknown member id", async () => {
    const rawEvents = [
      {
        event_id: "e-002",
        household_id: "h-001",
        event_type: "expense",
        event_title: "Groceries",
        event_date: "2026-03-11",
        event_status: "pending",
        related_member_id: "m-unknown",
        metadata_int: null,
        metadata_decimal: 50.0,
      },
    ];
    const mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: rawEvents, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCalendarEvents("h-001", "2026-03-09", "2026-03-15");
    expect(result[0].member_display_name).toBeNull();
  });

  it("returns null member name when related_member_id is null", async () => {
    const rawEvents = [
      {
        event_id: "e-003",
        household_id: "h-001",
        event_type: "proposal",
        event_title: "Buy new furniture",
        event_date: "2026-03-12",
        event_status: "pending",
        related_member_id: null,
        metadata_int: null,
        metadata_decimal: null,
      },
    ];
    const mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: rawEvents, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCalendarEvents("h-001", "2026-03-09", "2026-03-15");
    expect(result[0].member_display_name).toBeNull();
  });

  it("returns empty array on error", async () => {
    const mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: null, error: { message: "DB error" } })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCalendarEvents("h-001", "2026-03-09", "2026-03-15");
    expect(result).toEqual([]);
  });

  it("handles null event fields with defaults", async () => {
    const rawEvents = [
      {
        event_id: null,
        household_id: null,
        event_type: null,
        event_title: null,
        event_date: null,
        event_status: null,
        related_member_id: null,
        metadata_int: null,
        metadata_decimal: null,
      },
    ];
    const mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: rawEvents, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCalendarEvents("h-001", "2026-03-09", "2026-03-15");
    expect(result[0].event_id).toBe("");
    expect(result[0].event_type).toBe("chore");
    expect(result[0].event_title).toBe("");
  });
});
