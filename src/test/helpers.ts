import { vi } from "vitest";
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CurrentMembership } from "@/lib/household/queries";

// ---- FormData Builder ----

export function buildFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

// ---- Membership Factory ----

export function mockMembership(
  overrides: Partial<CurrentMembership> = {}
): CurrentMembership {
  return {
    memberId: "member-001",
    householdId: "household-001",
    userId: "user-001",
    role: "admin",
    ...overrides,
  };
}

// ---- Supabase Mock Factory ----

type SupabaseResult = { data: unknown; error: unknown; count?: number | null };

interface ChainableQuery {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

/**
 * Creates a chainable mock Supabase client.
 *
 * Usage:
 *   const mockSupa = createMockSupabase({ data: [...], error: null });
 *   vi.mocked(createClient).mockResolvedValue(mockSupa);
 */
export function createMockSupabase(
  defaultResult: SupabaseResult = { data: null, error: null }
) {
  const createChain = (result: SupabaseResult): ChainableQuery => {
    const chain: ChainableQuery = {} as ChainableQuery;

    const self = () => chain;
    chain.select = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.neq = vi.fn().mockReturnValue(chain);
    chain.is = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);
    chain.lte = vi.fn().mockReturnValue(chain);
    chain.lt = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue(result);
    chain.maybeSingle = vi.fn().mockResolvedValue(result);

    // Make chain thenable (resolves to result for non-terminal calls)
    chain.then = vi.fn((resolve) => resolve(result));
    // Allow await on the chain directly
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: SupabaseResult) => void) => {
        return Promise.resolve(result).then(resolve);
      },
      writable: true,
      configurable: true,
    });

    return chain;
  };

  const defaultChain = createChain(defaultResult);

  const mockSupabase = {
    from: vi.fn().mockReturnValue(defaultChain),
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
    // Expose chain creation for per-table overrides
    _createChain: createChain,
    _defaultChain: defaultChain,
  };

  return mockSupabase;
}

// ---- Component Render Wrapper ----

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// ---- UUID helper ----
// Zod v4 validates UUID version (pos 13 must be 1-8) and variant (pos 19 must be 8/9/a/b)

export const TEST_UUID = "550e8400-e29b-41d4-a716-446655440001";
export const TEST_UUID_2 = "550e8400-e29b-41d4-a716-446655440002";
export const TEST_UUID_3 = "550e8400-e29b-41d4-a716-446655440003";
