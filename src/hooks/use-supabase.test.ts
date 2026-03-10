import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock the client creation
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {},
    from: vi.fn(),
  }),
}));

import { useSupabase } from "./use-supabase";

describe("useSupabase", () => {
  it("returns a supabase client", () => {
    const { result } = renderHook(() => useSupabase());
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty("auth");
    expect(result.current).toHaveProperty("from");
  });

  it("returns the same instance on re-render (memoized)", () => {
    const { result, rerender } = renderHook(() => useSupabase());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
