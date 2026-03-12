import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { getAnnouncements } from "./queries";

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
});

describe("getAnnouncements", () => {
  it("returns announcements on success", async () => {
    const announcements = [
      {
        id: "a-001",
        household_id: "h-001",
        author_id: "m-001",
        content: "Hello",
        is_pinned: false,
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        author: {
          id: "m-001",
          role: "admin",
          users: { display_name: "Alice", avatar_url: null },
        },
        reactions: [],
      },
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: announcements, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getAnnouncements("h-001");
    expect(result).toEqual(announcements);
    expect(mockSupa.from).toHaveBeenCalledWith("announcements");
  });

  it("returns empty array on error", async () => {
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data: null, error: { message: "DB error" } })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getAnnouncements("h-001");
    expect(result).toEqual([]);
  });

  it("returns announcements with nested reactions", async () => {
    const data = [
      {
        id: "a-002",
        household_id: "h-001",
        author_id: "m-001",
        content: "Check this out",
        is_pinned: true,
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        author: {
          id: "m-001",
          role: "member",
          users: { display_name: "Bob", avatar_url: null },
        },
        reactions: [
          { id: "r-001", emoji: "heart", member_id: "m-002" },
          { id: "r-002", emoji: "thumbsup", member_id: "m-001" },
        ],
      },
    ];
    mockSupa = {
      from: vi.fn().mockReturnValue(
        createChain({ data, error: null })
      ),
    };
    mockCreateClient.mockResolvedValue(mockSupa);

    const result = await getAnnouncements("h-001");
    expect(result).toHaveLength(1);
    expect(result[0].reactions).toHaveLength(2);
  });
});
