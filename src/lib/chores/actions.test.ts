import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildFormData,
  mockMembership,
  TEST_UUID,
  TEST_UUID_2,
} from "@/test/helpers";

// ---- Hoisted mocks (available before vi.mock factories run) ----

const { mockGetCurrentMembership, mockRedirect, mockCreateClient } =
  vi.hoisted(() => {
    return {
      mockGetCurrentMembership: vi.fn(),
      mockRedirect: vi.fn(),
      mockCreateClient: vi.fn(),
    };
  });

vi.mock("@/lib/household/queries", () => ({
  getCurrentMembership: () => mockGetCurrentMembership(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT: ${url}`);
  },
}));

// Import after mocks
import {
  createChoreTemplate,
  completeChore,
  deleteChoreTemplate,
} from "./actions";

// ---- Supabase mock helper (inline, not hoisted) ----

function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  // Make the chain itself awaitable
  Object.defineProperty(chain, "then", {
    value: (resolve: (val: unknown) => void) =>
      Promise.resolve(result).then(resolve),
    writable: true,
    configurable: true,
  });
  return chain;
}

function createMockSupa() {
  const defaultChain = createChain({ data: null, error: null });
  return {
    from: vi.fn().mockReturnValue(defaultChain),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-001" } },
        error: null,
      }),
    },
  };
}

// ---- Setup ----

let mockSupa: ReturnType<typeof createMockSupa>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentMembership.mockResolvedValue(mockMembership());

  mockSupa = createMockSupa();
  mockCreateClient.mockResolvedValue(mockSupa);

  // Default: template insert succeeds
  const templateChain = createChain({
    data: {
      id: TEST_UUID,
      title: "Test Chore",
      points: 5,
      recurrence: "weekly",
      assigned_to: TEST_UUID_2,
    },
    error: null,
  });
  mockSupa.from.mockReturnValue(templateChain);
});

// ---- createChoreTemplate ----

describe("createChoreTemplate", () => {
  const validFormData = () =>
    buildFormData({
      title: "Clean kitchen",
      description: "Wipe counters",
      points: "5",
      recurrence: "weekly",
      assignedTo: TEST_UUID,
    });

  it("redirects on success", async () => {
    await expect(createChoreTemplate(validFormData())).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/my");
  });

  it("calls supabase insert for template", async () => {
    try {
      await createChoreTemplate(validFormData());
    } catch {
      // redirect throws
    }
    expect(mockSupa.from).toHaveBeenCalledWith("chore_templates");
  });

  it("generates instances after template creation", async () => {
    try {
      await createChoreTemplate(validFormData());
    } catch {
      // redirect throws
    }
    const fromCalls = mockSupa.from.mock.calls.map((c: string[]) => c[0]);
    expect(fromCalls).toContain("chore_templates");
    expect(fromCalls).toContain("chore_instances");
  });

  it("returns validation error for empty title", async () => {
    const fd = buildFormData({
      title: "",
      points: "5",
      recurrence: "weekly",
      assignedTo: TEST_UUID,
    });
    const result = await createChoreTemplate(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(mockSupa.from).not.toHaveBeenCalled();
  });

  it("returns validation error for invalid points", async () => {
    const fd = buildFormData({
      title: "Test",
      points: "0",
      recurrence: "weekly",
      assignedTo: TEST_UUID,
    });
    const result = await createChoreTemplate(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const result = await createChoreTemplate(validFormData());
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when template insert fails", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: { message: "DB error" } })
    );
    const result = await createChoreTemplate(validFormData());
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("Failed") })
    );
  });

  it("still redirects even if instance generation fails", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: {
            id: TEST_UUID,
            title: "Test",
            points: 5,
            recurrence: "weekly",
            assigned_to: TEST_UUID_2,
          },
          error: null,
        });
      }
      return createChain({ data: null, error: { message: "Instance error" } });
    });

    await expect(createChoreTemplate(validFormData())).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/my");
  });
});

// ---- completeChore ----

describe("completeChore", () => {
  beforeEach(() => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
  });

  it("returns success for valid input", async () => {
    const fd = buildFormData({ instanceId: TEST_UUID });
    const result = await completeChore(fd);
    expect(result).toEqual({ success: true });
  });

  it("calls update on chore_instances", async () => {
    const fd = buildFormData({ instanceId: TEST_UUID });
    await completeChore(fd);
    expect(mockSupa.from).toHaveBeenCalledWith("chore_instances");
  });

  it("returns validation error for invalid UUID", async () => {
    const fd = buildFormData({ instanceId: "not-a-uuid" });
    const result = await completeChore(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(mockSupa.from).not.toHaveBeenCalled();
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ instanceId: TEST_UUID });
    const result = await completeChore(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error on database failure", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: { message: "DB error" } })
    );
    const fd = buildFormData({ instanceId: TEST_UUID });
    const result = await completeChore(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("Failed") })
    );
  });
});

// ---- deleteChoreTemplate ----

describe("deleteChoreTemplate", () => {
  beforeEach(() => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "admin" })
    );

    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { members_can_edit_own_chores: true },
          error: null,
        });
      }
      return createChain({ data: null, error: null });
    });
  });

  it("returns success when admin deletes", async () => {
    const fd = buildFormData({ templateId: TEST_UUID });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns success when member deletes own template", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "member" })
    );

    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // household settings query
        return createChain({
          data: { members_can_edit_own_chores: true },
          error: null,
        });
      }
      if (callCount === 2) {
        // template ownership query — created_by matches memberId
        return createChain({
          data: { created_by: "member-001" },
          error: null,
        });
      }
      // update query
      return createChain({ data: null, error: null });
    });

    const fd = buildFormData({ templateId: TEST_UUID });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns permission error when member cannot edit", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "member" })
    );

    mockSupa.from.mockReturnValue(
      createChain({
        data: { members_can_edit_own_chores: false },
        error: null,
      })
    );

    const fd = buildFormData({ templateId: TEST_UUID });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("admin") })
    );
  });

  it("returns error when household not found", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
    const fd = buildFormData({ templateId: TEST_UUID });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual({ error: "Household not found" });
  });

  it("returns validation error for invalid UUID", async () => {
    const fd = buildFormData({ templateId: "bad-id" });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ templateId: TEST_UUID });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error on database failure", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { members_can_edit_own_chores: true },
          error: null,
        });
      }
      return createChain({ data: null, error: { message: "DB error" } });
    });

    const fd = buildFormData({ templateId: TEST_UUID });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("Failed") })
    );
  });

  it("returns error when member tries to delete another member's template", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "member" })
    );

    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // household settings — members_can_edit_own_chores enabled
        return createChain({
          data: { members_can_edit_own_chores: true },
          error: null,
        });
      }
      if (callCount === 2) {
        // template ownership — created_by is a DIFFERENT member
        return createChain({
          data: { created_by: "other-member-999" },
          error: null,
        });
      }
      return createChain({ data: null, error: null });
    });

    const fd = buildFormData({ templateId: TEST_UUID });
    const result = await deleteChoreTemplate(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("only delete templates you created") })
    );
  });
});
