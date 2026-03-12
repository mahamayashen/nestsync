import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFormData } from "@/test/helpers";

// ---- Hoisted mocks ----

const { mockRedirect, mockCreateClient, mockCreateAdminClient, mockGetPostAuthRedirect } =
  vi.hoisted(() => ({
    mockRedirect: vi.fn(),
    mockCreateClient: vi.fn(),
    mockCreateAdminClient: vi.fn(),
    mockGetPostAuthRedirect: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT: ${url}`);
  },
}));

vi.mock("@/lib/auth/redirect", () => ({
  getPostAuthRedirect: mockGetPostAuthRedirect,
}));

// Import after mocks
import {
  login,
  signup,
  forgotPassword,
  resetPassword,
  createHousehold,
  joinHousehold,
  signOut,
} from "./actions";

// ---- Chain helper ----

function createChain(result: { data: unknown; error: unknown; count?: number | null }) {
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

// ---- Setup ----

let mockSupa: {
  from: ReturnType<typeof vi.fn>;
  auth: Record<string, ReturnType<typeof vi.fn>>;
};

let mockAdmin: {
  from: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();

  mockSupa = {
    from: vi.fn().mockReturnValue(createChain({ data: null, error: null })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-001", email: "test@example.com" } },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  };
  mockCreateClient.mockResolvedValue(mockSupa);

  mockAdmin = {
    from: vi.fn().mockReturnValue(createChain({ data: null, error: null })),
  };
  mockCreateAdminClient.mockReturnValue(mockAdmin);

  mockGetPostAuthRedirect.mockResolvedValue("/dashboard/household");
});

// ---- login ----

describe("login", () => {
  it("redirects on successful login", async () => {
    const fd = buildFormData({
      email: "user@example.com",
      password: "password123",
    });
    await expect(login(fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockSupa.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("returns error for invalid credentials", async () => {
    mockSupa.auth.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const fd = buildFormData({
      email: "user@example.com",
      password: "wrongpass",
    });
    const result = await login(fd);
    expect(result).toEqual({ error: "Invalid login credentials" });
  });

  it("returns validation error for invalid email", async () => {
    const fd = buildFormData({ email: "bad", password: "password123" });
    const result = await login(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(mockSupa.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns validation error for empty password", async () => {
    const fd = buildFormData({ email: "user@example.com", password: "" });
    const result = await login(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});

// ---- signup ----

describe("signup", () => {
  it("redirects to onboarding on success", async () => {
    const fd = buildFormData({
      email: "new@example.com",
      password: "secure123",
      displayName: "New User",
    });
    await expect(signup(fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/onboarding");
  });

  it("sends display name in user metadata", async () => {
    const fd = buildFormData({
      email: "new@example.com",
      password: "secure123",
      displayName: "Test Name",
    });
    try {
      await signup(fd);
    } catch {
      // redirect
    }
    expect(mockSupa.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { data: { display_name: "Test Name" } },
      })
    );
  });

  it("returns error when auth fails", async () => {
    mockSupa.auth.signUp.mockResolvedValue({
      error: { message: "Email already registered" },
    });
    const fd = buildFormData({
      email: "existing@example.com",
      password: "secure123",
      displayName: "User",
    });
    const result = await signup(fd);
    expect(result).toEqual({ error: "Email already registered" });
  });

  it("returns validation error for short password", async () => {
    const fd = buildFormData({
      email: "new@example.com",
      password: "12345",
      displayName: "User",
    });
    const result = await signup(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(mockSupa.auth.signUp).not.toHaveBeenCalled();
  });

  it("returns validation error for short display name", async () => {
    const fd = buildFormData({
      email: "new@example.com",
      password: "secure123",
      displayName: "A",
    });
    const result = await signup(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});

// ---- forgotPassword ----

describe("forgotPassword", () => {
  it("always returns success for security", async () => {
    const fd = buildFormData({ email: "user@example.com" });
    const result = await forgotPassword(fd);
    expect(result).toEqual({ success: true });
  });

  it("calls resetPasswordForEmail", async () => {
    const fd = buildFormData({ email: "user@example.com" });
    await forgotPassword(fd);
    expect(mockSupa.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({ redirectTo: expect.any(String) })
    );
  });

  it("returns validation error for invalid email", async () => {
    const fd = buildFormData({ email: "not-an-email" });
    const result = await forgotPassword(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});

// ---- resetPassword ----

describe("resetPassword", () => {
  it("redirects on success", async () => {
    const fd = buildFormData({
      password: "newpass123",
      confirmPassword: "newpass123",
    });
    await expect(resetPassword(fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/login")
    );
  });

  it("calls updateUser with new password", async () => {
    const fd = buildFormData({
      password: "newpass123",
      confirmPassword: "newpass123",
    });
    try {
      await resetPassword(fd);
    } catch {
      // redirect
    }
    expect(mockSupa.auth.updateUser).toHaveBeenCalledWith({
      password: "newpass123",
    });
  });

  it("returns error when auth fails", async () => {
    mockSupa.auth.updateUser.mockResolvedValue({
      error: { message: "Session expired" },
    });
    const fd = buildFormData({
      password: "newpass123",
      confirmPassword: "newpass123",
    });
    const result = await resetPassword(fd);
    expect(result).toEqual({ error: "Session expired" });
  });

  it("returns validation error for mismatched passwords", async () => {
    const fd = buildFormData({
      password: "newpass123",
      confirmPassword: "different",
    });
    const result = await resetPassword(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(mockSupa.auth.updateUser).not.toHaveBeenCalled();
  });

  it("returns validation error for short password", async () => {
    const fd = buildFormData({
      password: "12345",
      confirmPassword: "12345",
    });
    const result = await resetPassword(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});

// ---- createHousehold ----

describe("createHousehold", () => {
  beforeEach(() => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChain({ data: { id: "household-001" }, error: null });
      }
      return createChain({ data: { id: "member-001" }, error: null });
    });

    mockAdmin.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
  });

  it("redirects to dashboard on success", async () => {
    const fd = buildFormData({
      name: "My Household",
      timezone: "America/New_York",
    });
    await expect(createHousehold(fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/household");
  });

  it("creates household, membership, and admin history", async () => {
    const fd = buildFormData({
      name: "My Household",
      timezone: "America/New_York",
    });
    try {
      await createHousehold(fd);
    } catch {
      // redirect
    }
    expect(mockSupa.from).toHaveBeenCalledWith("households");
    expect(mockSupa.from).toHaveBeenCalledWith("household_members");
    expect(mockAdmin.from).toHaveBeenCalledWith("admin_history");
  });

  it("returns error when not authenticated", async () => {
    mockSupa.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const fd = buildFormData({
      name: "My House",
      timezone: "America/New_York",
    });
    const result = await createHousehold(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when household insert fails", async () => {
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: { message: "Insert error" } })
    );
    const fd = buildFormData({
      name: "My House",
      timezone: "America/New_York",
    });
    const result = await createHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("Failed") })
    );
  });

  it("returns validation error for empty name", async () => {
    const fd = buildFormData({ name: "", timezone: "America/New_York" });
    const result = await createHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});

// ---- joinHousehold ----

describe("joinHousehold", () => {
  beforeEach(() => {
    let adminCallCount = 0;
    mockAdmin.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        return createChain({
          data: { id: "household-001", max_members: 10, deleted_at: null },
          error: null,
        });
      }
      if (adminCallCount === 2) {
        return createChain({ data: null, error: null });
      }
      return createChain({ data: null, error: null, count: 3 });
    });

    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
  });

  it("redirects to dashboard on success", async () => {
    const fd = buildFormData({ inviteCode: "ABC12345" });
    await expect(joinHousehold(fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/household");
  });

  it("returns error for invalid invite code", async () => {
    mockAdmin.from.mockReturnValue(
      createChain({ data: null, error: null })
    );
    const fd = buildFormData({ inviteCode: "BADCODE" });
    const result = await joinHousehold(fd);
    expect(result).toEqual({ error: "Invalid invite code" });
  });

  it("returns error for deleted household", async () => {
    mockAdmin.from.mockReturnValue(
      createChain({
        data: {
          id: "household-001",
          max_members: 10,
          deleted_at: "2025-01-01T00:00:00Z",
        },
        error: null,
      })
    );
    const fd = buildFormData({ inviteCode: "ABC12345" });
    const result = await joinHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringContaining("no longer active"),
      })
    );
  });

  it("returns error when already in a household", async () => {
    let adminCallCount = 0;
    mockAdmin.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        return createChain({
          data: { id: "household-001", max_members: 10, deleted_at: null },
          error: null,
        });
      }
      return createChain({
        data: { id: "existing-member" },
        error: null,
      });
    });

    const fd = buildFormData({ inviteCode: "ABC12345" });
    const result = await joinHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringContaining("already a member"),
      })
    );
  });

  it("returns validation error for empty code", async () => {
    const fd = buildFormData({ inviteCode: "" });
    const result = await joinHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("returns error when not authenticated", async () => {
    mockSupa.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const fd = buildFormData({ inviteCode: "ABC12345" });
    const result = await joinHousehold(fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });
});

// ---- signOut ----

describe("signOut", () => {
  it("calls supabase signOut and redirects", async () => {
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockSupa.auth.signOut).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("still redirects to /login even when signOut returns an error", async () => {
    mockSupa.auth.signOut.mockResolvedValue({
      error: { message: "Network error" },
    });
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});

// ---- signup with invite code ----

describe("signup with invite code", () => {
  it("redirects to /dashboard when invite code join succeeds", async () => {
    // Make joinHouseholdByCode succeed: admin household lookup returns household, no existing membership, count < max, insert succeeds
    let adminCallCount = 0;
    mockAdmin.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        // household lookup
        return createChain({
          data: { id: "household-001", max_members: 10, deleted_at: null },
          error: null,
        });
      }
      if (adminCallCount === 2) {
        // existing membership check
        return createChain({ data: null, error: null });
      }
      // count check
      return createChain({ data: null, error: null, count: 3 });
    });
    // supabase client: getUser returns user, insert succeeds
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: null })
    );

    const fd = buildFormData({
      email: "new@example.com",
      password: "secure123",
      displayName: "New User",
      inviteCode: "VALIDCODE",
    });
    await expect(signup(fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/household");
  });

  it("redirects to /onboarding when invite code join fails", async () => {
    // Make joinHouseholdByCode fail: admin returns null household
    mockAdmin.from.mockReturnValue(
      createChain({ data: null, error: null })
    );

    const fd = buildFormData({
      email: "new@example.com",
      password: "secure123",
      displayName: "New User",
      inviteCode: "BADCODE",
    });
    await expect(signup(fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/onboarding");
  });
});

// ---- createHousehold - member insert failure ----

describe("createHousehold - member insert failure", () => {
  it("returns error when member insert fails", async () => {
    let callCount = 0;
    mockSupa.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // household insert succeeds
        return createChain({ data: { id: "household-001" }, error: null });
      }
      // member insert fails
      return createChain({ data: null, error: { message: "Insert error" } });
    });

    const fd = buildFormData({
      name: "My House",
      timezone: "America/New_York",
    });
    const result = await createHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("membership") })
    );
  });
});

// ---- joinHousehold - additional edge cases ----

describe("joinHousehold - full household", () => {
  it("returns error when household is full", async () => {
    let adminCallCount = 0;
    mockAdmin.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        return createChain({
          data: { id: "household-001", max_members: 5, deleted_at: null },
          error: null,
        });
      }
      if (adminCallCount === 2) {
        // no existing membership
        return createChain({ data: null, error: null });
      }
      // count at max
      return createChain({ data: null, error: null, count: 5 });
    });

    const fd = buildFormData({ inviteCode: "FULLCODE" });
    const result = await joinHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("full") })
    );
  });

  it("returns 'already a member' when insert fails with 23505", async () => {
    let adminCallCount = 0;
    mockAdmin.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        return createChain({
          data: { id: "household-001", max_members: 10, deleted_at: null },
          error: null,
        });
      }
      if (adminCallCount === 2) {
        return createChain({ data: null, error: null });
      }
      return createChain({ data: null, error: null, count: 2 });
    });
    // supabase insert fails with 23505
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: { code: "23505", message: "Duplicate" } })
    );

    const fd = buildFormData({ inviteCode: "DUPCODE" });
    const result = await joinHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("already a member") })
    );
  });

  it("returns generic error when insert fails with other error", async () => {
    let adminCallCount = 0;
    mockAdmin.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        return createChain({
          data: { id: "household-001", max_members: 10, deleted_at: null },
          error: null,
        });
      }
      if (adminCallCount === 2) {
        return createChain({ data: null, error: null });
      }
      return createChain({ data: null, error: null, count: 2 });
    });
    // supabase insert fails with non-23505 error
    mockSupa.from.mockReturnValue(
      createChain({ data: null, error: { code: "50000", message: "DB error" } })
    );

    const fd = buildFormData({ inviteCode: "ERRCODE" });
    const result = await joinHousehold(fd);
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringContaining("Failed") })
    );
  });
});
