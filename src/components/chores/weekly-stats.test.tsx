import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { WeeklyStats } from "./weekly-stats";
import { renderWithProviders } from "@/test/helpers";

// Hoisted mutable resolver so individual tests can control query resolution
const { mockThenImpl } = vi.hoisted(() => ({
  mockThenImpl: vi.fn(),
}));

vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.is = () => chain;
      chain.not = () => chain;
      chain.gte = () => chain;
      chain.lte = () => chain;
      chain.order = () => chain;
      Object.defineProperty(chain, "then", {
        value: (resolve: (val: unknown) => void) => mockThenImpl(resolve),
        writable: true,
        configurable: true,
      });
      return chain;
    },
  }),
}));

// Reset to never-resolve before each test so existing tests are unaffected
beforeEach(() => {
  mockThenImpl.mockImplementation(() => {
    /* never calls resolve – initialData is used */
  });
});

const mockStats = [
  { memberId: "m-1", displayName: "Alice", points: 15, count: 3 },
  { memberId: "m-2", displayName: "Bob", points: 10, count: 5 },
  { memberId: "m-3", displayName: "Carol", points: 5, count: 1 },
];

describe("WeeklyStats", () => {
  it("renders heading", () => {
    renderWithProviders(
      <WeeklyStats householdId="h-001" initialStats={mockStats} />
    );
    expect(screen.getByText(/this week/i)).toBeInTheDocument();
  });

  it("shows empty state when no stats", () => {
    renderWithProviders(
      <WeeklyStats householdId="h-001" initialStats={[]} />
    );
    expect(
      screen.getByText("No chores completed this week")
    ).toBeInTheDocument();
  });

  it("renders member names", () => {
    renderWithProviders(
      <WeeklyStats householdId="h-001" initialStats={mockStats} />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("renders points for each member", () => {
    renderWithProviders(
      <WeeklyStats householdId="h-001" initialStats={mockStats} />
    );
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders chore counts", () => {
    renderWithProviders(
      <WeeklyStats householdId="h-001" initialStats={mockStats} />
    );
    expect(screen.getByText("(3 chores)")).toBeInTheDocument();
    expect(screen.getByText("(5 chores)")).toBeInTheDocument();
    expect(screen.getByText("(1 chore)")).toBeInTheDocument();
  });

  it("renders ranking numbers", () => {
    renderWithProviders(
      <WeeklyStats householdId="h-001" initialStats={mockStats} />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows empty state when initialStats is undefined", () => {
    renderWithProviders(<WeeklyStats householdId="h-001" />);
    expect(
      screen.getByText("No chores completed this week")
    ).toBeInTheDocument();
  });

  // --- queryFn coverage tests ---

  it("shows live data aggregated from resolved query", async () => {
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({
        data: [
          {
            completed_by: "m-1",
            points: 10,
            household_members: {
              id: "m-1",
              users: { display_name: "Alice" },
            },
          },
          {
            completed_by: "m-2",
            points: 5,
            household_members: {
              id: "m-2",
              users: { display_name: "Bob" },
            },
          },
        ],
        error: null,
      })
    );
    renderWithProviders(<WeeklyStats householdId="h-001" initialStats={[]} />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("accumulates points when the same member appears multiple times", async () => {
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({
        data: [
          {
            completed_by: "m-1",
            points: 5,
            household_members: {
              id: "m-1",
              users: { display_name: "Alice" },
            },
          },
          {
            completed_by: "m-1",
            points: 8,
            household_members: {
              id: "m-1",
              users: { display_name: "Alice" },
            },
          },
        ],
        error: null,
      })
    );
    renderWithProviders(<WeeklyStats householdId="h-001" initialStats={[]} />);
    await waitFor(() => {
      expect(screen.getByText("13")).toBeInTheDocument();
    });
    expect(screen.getByText("(2 chores)")).toBeInTheDocument();
  });

  it("shows empty state when query returns an error", async () => {
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({ data: null, error: { message: "DB error" } })
    );
    renderWithProviders(<WeeklyStats householdId="h-001" initialStats={[]} />);
    await waitFor(() => {
      expect(
        screen.getByText("No chores completed this week")
      ).toBeInTheDocument();
    });
  });

  it("shows Unknown display name when household_members is null", async () => {
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({
        data: [
          {
            completed_by: "m-x",
            points: 3,
            household_members: null,
          },
        ],
        error: null,
      })
    );
    renderWithProviders(<WeeklyStats householdId="h-001" initialStats={[]} />);
    await waitFor(() => {
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("sorts members by points descending", async () => {
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({
        data: [
          {
            completed_by: "m-2",
            points: 3,
            household_members: {
              id: "m-2",
              users: { display_name: "Bob" },
            },
          },
          {
            completed_by: "m-1",
            points: 12,
            household_members: {
              id: "m-1",
              users: { display_name: "Alice" },
            },
          },
        ],
        error: null,
      })
    );
    renderWithProviders(<WeeklyStats householdId="h-001" initialStats={[]} />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    // Alice (12 pts) should appear before Bob (3 pts) → rank 1 text comes first
    const items = screen.getAllByText(/\d+/);
    const allText = items.map((el) => el.textContent).join(" ");
    expect(allText.indexOf("12")).toBeLessThan(allText.indexOf("3"));
  });
});
