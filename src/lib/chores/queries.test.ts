import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks ----
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/chores/instance-generator", () => ({
  computeRecurrenceDates: vi.fn().mockReturnValue([]),
  formatDateForDB: (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
}));

import {
  getChoreInstances,
  getChoreTemplates,
  getWeeklyChoreStats,
  getCompletionStreak,
  getOnTimeRate,
  getWeekComparison,
  getTodayProgress,
} from "./queries";

// ---- Chain helper ----
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.gt = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
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

// ---- getCompletionStreak ----

describe("getCompletionStreak", () => {
  it("returns 0 on error", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: null, error: { message: "err" } })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);
    const result = await getCompletionStreak("h-001");
    expect(result).toBe(0);
  });

  it("returns 0 when no data", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: [], error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);
    const result = await getCompletionStreak("h-001");
    expect(result).toBe(0);
  });

  it("counts consecutive complete days", async () => {
    // Yesterday and day before: all completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const data = [
      { due_date: fmt(yesterday), status: "completed" },
      { due_date: fmt(dayBefore), status: "completed" },
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCompletionStreak("h-001");
    expect(result).toBe(2);
  });

  it("breaks streak when a day has incomplete chores", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const data = [
      { due_date: fmt(yesterday), status: "completed" },
      { due_date: fmt(dayBefore), status: "pending" },
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCompletionStreak("h-001");
    expect(result).toBe(1);
  });

  it("accepts optional memberId filter", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: [], error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getCompletionStreak("h-001", "m-001");
    expect(result).toBe(0);
  });
});

// ---- getOnTimeRate ----

describe("getOnTimeRate", () => {
  it("returns zeros on error", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: null, error: { message: "err" } })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getOnTimeRate("h-001");
    expect(result).toEqual({ onTime: 0, total: 0, rate: 0 });
  });

  it("returns zeros when no completed chores", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: [], error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getOnTimeRate("h-001");
    expect(result).toEqual({ onTime: 0, total: 0, rate: 0 });
  });

  it("calculates on-time rate correctly", async () => {
    const data = [
      { due_date: "2026-03-10", completed_at: "2026-03-10T14:00:00Z" }, // on time
      { due_date: "2026-03-09", completed_at: "2026-03-09T10:00:00Z" }, // on time
      { due_date: "2026-03-08", completed_at: "2026-03-10T10:00:00Z" }, // late
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getOnTimeRate("h-001");
    expect(result.total).toBe(3);
    expect(result.onTime).toBe(2);
    expect(result.rate).toBe(67); // Math.round(2/3 * 100)
  });

  it("handles completed_at being null", async () => {
    const data = [
      { due_date: "2026-03-10", completed_at: null },
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getOnTimeRate("h-001");
    expect(result.total).toBe(1);
    expect(result.onTime).toBe(0);
  });

  it("accepts optional memberId filter", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: [], error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getOnTimeRate("h-001", "m-001");
    expect(result).toEqual({ onTime: 0, total: 0, rate: 0 });
  });
});

// ---- getWeekComparison ----

describe("getWeekComparison", () => {
  it("returns zeros on error", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: null, error: { message: "err" } })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeekComparison("h-001");
    expect(result).toEqual({ thisWeek: 0, lastWeek: 0, diff: 0 });
  });

  it("splits points between this week and last week", async () => {
    // This week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const thisMonday = new Date(now);
    thisMonday.setHours(0, 0, 0, 0);
    thisMonday.setDate(thisMonday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const thisWeekDate = new Date(thisMonday);
    thisWeekDate.setHours(10, 0, 0, 0);

    const lastWeekDate = new Date(thisMonday);
    lastWeekDate.setDate(lastWeekDate.getDate() - 3);
    lastWeekDate.setHours(10, 0, 0, 0);

    const data = [
      { points: 5, completed_at: thisWeekDate.toISOString() },
      { points: 3, completed_at: lastWeekDate.toISOString() },
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeekComparison("h-001");
    expect(result.thisWeek).toBe(5);
    expect(result.lastWeek).toBe(3);
    expect(result.diff).toBe(2);
  });

  it("handles null completed_at gracefully", async () => {
    const data = [{ points: 5, completed_at: null }];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeekComparison("h-001");
    expect(result.thisWeek).toBe(0);
    expect(result.lastWeek).toBe(0);
  });

  it("accepts optional memberId filter", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: [], error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getWeekComparison("h-001", "m-001");
    expect(result).toEqual({ thisWeek: 0, lastWeek: 0, diff: 0 });
  });
});

// ---- getTodayProgress ----

describe("getTodayProgress", () => {
  it("returns zeros on error", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: null, error: { message: "err" } })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getTodayProgress("h-001");
    expect(result).toEqual({ completed: 0, total: 0 });
  });

  it("counts completed and total correctly", async () => {
    const data = [
      { status: "completed" },
      { status: "completed" },
      { status: "pending" },
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getTodayProgress("h-001");
    expect(result).toEqual({ completed: 2, total: 3 });
  });

  it("returns zero total when no chores today", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: [], error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getTodayProgress("h-001");
    expect(result).toEqual({ completed: 0, total: 0 });
  });
});
