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
  it("returns /dashboard when user has membership", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: { id: "member-001" }, error: null })
    );
    const result = await getPostAuthRedirect();
    expect(result).toBe("/dashboard");
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

  it("returns /dashboard when override is null and user has membership", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: { id: "member-001" }, error: null })
    );
    const result = await getPostAuthRedirect(null);
    expect(result).toBe("/dashboard");
  });

  it("uses existing client instead of creating new one (OAuth callback)", async () => {
    // Simulate the OAuth callback scenario: pass a pre-authenticated client
    const existingClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "oauth-user" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(
        createChain({ data: { id: "member-oauth" }, error: null })
      ),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getPostAuthRedirect(null, existingClient as any);

    expect(result).toBe("/dashboard");
    // Should use existing client, NOT createClient()
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(existingClient.auth.getUser).toHaveBeenCalled();
  });

  it("uses existing client and routes new user to /onboarding", async () => {
    const existingClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "new-oauth-user" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(
        createChain({ data: null, error: null })
      ),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getPostAuthRedirect(null, existingClient as any);

    expect(result).toBe("/onboarding");
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
