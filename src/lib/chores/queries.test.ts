import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks ----
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import {
  getChoreInstances,
  getChoreTemplates,
  getWeeklyChoreStats,
} from "./queries";

// ---- Chain helper ----
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
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
});

// ---- getChoreInstances ----

describe("getChoreInstances", () => {
  it("returns instances on success", async () => {
    const instances = [
      { id: "i-001", title: "Wash Dishes", status: "pending" },
    ];
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: instances, error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreInstances("household-001");
    expect(result).toEqual(instances);
    expect(mockSupa.from).toHaveBeenCalledWith("chore_instances");
  });

  it("returns empty array on error", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: null, error: { message: "err" } })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreInstances("household-001");
    expect(result).toEqual([]);
  });

  it("applies status filter", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: [], error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    await getChoreInstances("h-001", { status: "pending" });
    expect(mockSupa.from).toHaveBeenCalledWith("chore_instances");
  });

  it("applies assignedTo filter with null (unassigned)", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: [], error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreInstances("h-001", { assignedTo: null });
    expect(result).toEqual([]);
  });

  it("applies date range filters", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: [], error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreInstances("h-001", {
      dateFrom: "2025-03-01",
      dateTo: "2025-03-31",
    });
    expect(result).toEqual([]);
  });

  it("applies assignedTo filter with non-null member id", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: [], error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreInstances("h-001", { assignedTo: "member-001" });
    expect(result).toEqual([]);
  });

  it("applies only dateFrom filter without dateTo", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: [], error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreInstances("h-001", { dateFrom: "2025-03-01" });
    expect(result).toEqual([]);
  });

  it("applies only dateTo filter without dateFrom", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: [], error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreInstances("h-001", { dateTo: "2025-03-31" });
    expect(result).toEqual([]);
  });
});

// ---- getChoreTemplates ----

describe("getChoreTemplates", () => {
  it("returns templates on success", async () => {
    const templates = [
      { id: "t-001", title: "Clean Kitchen", recurrence: "weekly" },
    ];
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: templates, error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreTemplates("household-001");
    expect(result).toEqual(templates);
    expect(mockSupa.from).toHaveBeenCalledWith("chore_templates");
  });

  it("returns empty array on error", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: null, error: { message: "err" } })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getChoreTemplates("household-001");
    expect(result).toEqual([]);
  });
});

// ---- getWeeklyChoreStats ----

describe("getWeeklyChoreStats", () => {
  it("returns aggregated stats sorted by points", async () => {
    const rawData = [
      {
        completed_by: "m-001",
        points: 5,
        completed_member: { id: "m-001", users: { display_name: "Alice" } },
      },
      {
        completed_by: "m-001",
        points: 3,
        completed_member: { id: "m-001", users: { display_name: "Alice" } },
      },
      {
        completed_by: "m-002",
        points: 10,
        completed_member: { id: "m-002", users: { display_name: "Bob" } },
      },
    ];
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: rawData, error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeeklyChoreStats("household-001");
    expect(result).toHaveLength(2);
    // Bob (10 points) should be first
    expect(result[0].displayName).toBe("Bob");
    expect(result[0].points).toBe(10);
    expect(result[0].count).toBe(1);
    // Alice (5+3=8 points) second
    expect(result[1].displayName).toBe("Alice");
    expect(result[1].points).toBe(8);
    expect(result[1].count).toBe(2);
  });

  it("returns empty array on error", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: null, error: { message: "err" } })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeeklyChoreStats("household-001");
    expect(result).toEqual([]);
  });

  it("returns empty array when no data", async () => {
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: [], error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeeklyChoreStats("household-001");
    expect(result).toEqual([]);
  });

  it("handles unknown member name gracefully", async () => {
    const rawData = [
      {
        completed_by: "m-001",
        points: 5,
        completed_member: null,
      },
    ];
    mockSupa = { from: vi.fn().mockReturnValue(createChain({ data: rawData, error: null })) };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeeklyChoreStats("household-001");
    expect(result[0].displayName).toBe("Unknown");
  });
});
