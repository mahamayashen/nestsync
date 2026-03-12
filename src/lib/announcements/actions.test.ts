import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildFormData,
  mockMembership,
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

import {
  createAnnouncement,
  togglePinAnnouncement,
  deleteAnnouncement,
  toggleReaction,
} from "./actions";

// ---- Supabase mock helper ----
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
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
  return { from: vi.fn().mockReturnValue(defaultChain) };
}

let mockSupa: ReturnType<typeof createMockSupa>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentMembership.mockResolvedValue(mockMembership());
  mockSupa = createMockSupa();
  mockCreateClient.mockResolvedValue(mockSupa);
});

// ---- createAnnouncement ----

describe("createAnnouncement", () => {
  it("returns success on valid input", async () => {
    const fd = buildFormData({ content: "Hello world" });
    const result = await createAnnouncement(fd);
    expect(result).toEqual({ success: true });
  });

  it("calls supabase insert on announcements table", async () => {
    const fd = buildFormData({ content: "Hello" });
    await createAnnouncement(fd);
    expect(mockSupa.from).toHaveBeenCalledWith("announcements");
  });

  it("returns validation error for empty content", async () => {
    const fd = buildFormData({ content: "" });
    const result = await createAnnouncement(fd);
    expect(result.error).toBeDefined();
    expect(mockSupa.from).not.toHaveBeenCalled();
  });

  it("returns validation error for content > 2000 chars", async () => {
    const fd = buildFormData({ content: "x".repeat(2001) });
    const result = await createAnnouncement(fd);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ content: "Hello" });
    const result = await createAnnouncement(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error on database failure", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: { message: "DB error" } })
    );
    const fd = buildFormData({ content: "Hello" });
    const result = await createAnnouncement(fd);
    expect(result.error).toMatch(/failed/i);
  });
});

// ---- togglePinAnnouncement ----

describe("togglePinAnnouncement", () => {
  it("returns success when admin toggles pin", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "admin" })
    );
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { author_id: "other-member", is_pinned: false },
          error: null,
        });
      }
      return createChain({ data: null, error: null });
    });
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await togglePinAnnouncement(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns success when author toggles pin", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "member" })
    );
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { author_id: "member-001", is_pinned: true },
          error: null,
        });
      }
      return createChain({ data: null, error: null });
    });
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await togglePinAnnouncement(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns validation error for invalid UUID", async () => {
    const fd = buildFormData({ announcementId: "bad" });
    const result = await togglePinAnnouncement(fd);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await togglePinAnnouncement(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when announcement not found", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await togglePinAnnouncement(fd);
    expect(result).toEqual({ error: "Announcement not found" });
  });

  it("returns permission error when non-admin non-author tries", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "member" })
    );
    mockSupa.from.mockReturnValue(
      createChain({
        data: { author_id: "other-member-999", is_pinned: false },
        error: null,
      })
    );
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await togglePinAnnouncement(fd);
    expect(result.error).toMatch(/permission/i);
  });

  it("returns error on database update failure", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { author_id: "member-001", is_pinned: false },
          error: null,
        });
      }
      return createChain({ data: null, error: { message: "DB error" } });
    });
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await togglePinAnnouncement(fd);
    expect(result.error).toMatch(/failed/i);
  });
});

// ---- deleteAnnouncement ----

describe("deleteAnnouncement", () => {
  it("returns success when admin deletes", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "admin" })
    );
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { author_id: "other-member" },
          error: null,
        });
      }
      return createChain({ data: null, error: null });
    });
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await deleteAnnouncement(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns success when author deletes own", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "member" })
    );
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { author_id: "member-001" },
          error: null,
        });
      }
      return createChain({ data: null, error: null });
    });
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await deleteAnnouncement(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns validation error for invalid UUID", async () => {
    const fd = buildFormData({ announcementId: "bad" });
    const result = await deleteAnnouncement(fd);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await deleteAnnouncement(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when announcement not found", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await deleteAnnouncement(fd);
    expect(result).toEqual({ error: "Announcement not found" });
  });

  it("returns permission error for non-admin non-author", async () => {
    mockGetCurrentMembership.mockResolvedValue(
      mockMembership({ role: "member" })
    );
    mockSupa.from.mockReturnValue(
      createChain({
        data: { author_id: "other-member-999" },
        error: null,
      })
    );
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await deleteAnnouncement(fd);
    expect(result.error).toMatch(/permission/i);
  });

  it("returns error on database update failure", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({
          data: { author_id: "member-001" },
          error: null,
        });
      }
      return createChain({ data: null, error: { message: "DB error" } });
    });
    const fd = buildFormData({ announcementId: TEST_UUID });
    const result = await deleteAnnouncement(fd);
    expect(result.error).toMatch(/failed/i);
  });
});

// ---- toggleReaction ----

describe("toggleReaction", () => {
  it("adds reaction when none exists", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Check for existing — none found
        return createChain({ data: null, error: null });
      }
      // Insert new reaction
      return createChain({ data: null, error: null });
    });
    const fd = buildFormData({ announcementId: TEST_UUID, emoji: "heart" });
    const result = await toggleReaction(fd);
    expect(result).toEqual({ success: true });
  });

  it("removes reaction when one exists", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Check for existing — found
        return createChain({ data: { id: "reaction-001" }, error: null });
      }
      // Delete existing reaction
      return createChain({ data: null, error: null });
    });
    const fd = buildFormData({ announcementId: TEST_UUID, emoji: "heart" });
    const result = await toggleReaction(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns validation error for invalid emoji", async () => {
    const fd = buildFormData({
      announcementId: TEST_UUID,
      emoji: "invalid-emoji",
    });
    const result = await toggleReaction(fd);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for invalid UUID", async () => {
    const fd = buildFormData({ announcementId: "bad", emoji: "heart" });
    const result = await toggleReaction(fd);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockGetCurrentMembership.mockResolvedValue(null);
    const fd = buildFormData({ announcementId: TEST_UUID, emoji: "fire" });
    const result = await toggleReaction(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error on insert failure", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({ data: null, error: null });
      }
      return createChain({ data: null, error: { message: "DB error" } });
    });
    const fd = buildFormData({
      announcementId: TEST_UUID,
      emoji: "thumbsup",
    });
    const result = await toggleReaction(fd);
    expect(result.error).toMatch(/failed/i);
  });

  it("returns error on delete failure", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({ data: { id: "r-001" }, error: null });
      }
      return createChain({ data: null, error: { message: "DB error" } });
    });
    const fd = buildFormData({
      announcementId: TEST_UUID,
      emoji: "thumbsup",
    });
    const result = await toggleReaction(fd);
    expect(result.error).toMatch(/failed/i);
  });
});
