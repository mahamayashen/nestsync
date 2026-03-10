import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { WeeklyStats } from "./weekly-stats";
import { renderWithProviders } from "@/test/helpers";

// Mock useSupabase — return a chain that never resolves so initialData is used
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
        value: () => new Promise(() => {}),
        writable: true,
        configurable: true,
      });
      return chain;
    },
  }),
}));

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
});
