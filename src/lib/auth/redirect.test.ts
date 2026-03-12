import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks ----
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { getPostAuthRedirect } from "./redirect";

// ---- Chain helper ----
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
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
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-001" } },
        error: null,
      }),
    },
  };
  mockCreateClient.mockResolvedValue(mockSupa);
});

describe("getPostAuthRedirect", () => {
  it("returns /dashboard/household when user has membership", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: { id: "member-001" }, error: null })
    );
    const result = await getPostAuthRedirect();
    expect(result).toBe("/dashboard/household");
  });

  it("returns /onboarding when user has no membership", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
    const result = await getPostAuthRedirect();
    expect(result).toBe("/onboarding");
  });

  it("returns /login when not authenticated", async () => {
    mockSupa.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const result = await getPostAuthRedirect();
    expect(result).toBe("/login");
  });

  it("returns override redirect when user has membership", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: { id: "member-001" }, error: null })
    );
    const result = await getPostAuthRedirect("/custom-path");
    expect(result).toBe("/custom-path");
  });

  it("returns /dashboard/household when override is null and user has membership", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: { id: "member-001" }, error: null })
    );
    const result = await getPostAuthRedirect(null);
    expect(result).toBe("/dashboard/household");
  });
});
