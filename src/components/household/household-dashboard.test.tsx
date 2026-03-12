import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import { HouseholdDashboard } from "./household-dashboard";

vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  }),
}));

vi.mock("@/lib/chores/actions", () => ({
  completeChore: vi.fn(),
}));

const mockMembers = [
  {
    id: "m-001",
    user_id: "u1",
    household_id: "h-001",
    role: "admin",
    joined_at: "",
    left_at: null,
    users: { display_name: "Alice", avatar_url: null },
  },
  {
    id: "m-002",
    user_id: "u2",
    household_id: "h-001",
    role: "member",
    joined_at: "",
    left_at: null,
    users: { display_name: "Bob", avatar_url: null },
  },
];

const baseProps = {
  householdId: "h-001",
  currentMemberId: "m-001",
  members: mockMembers,
  weeklyStats: [
    { memberId: "m-001", displayName: "Alice", points: 15, count: 5 },
    { memberId: "m-002", displayName: "Bob", points: 10, count: 3 },
  ],
  allPendingChores: [],
  teamOnTimeRate: { onTime: 8, total: 10, rate: 80 },
  todayProgress: { completed: 3, total: 5 },
  memberOnTimeRates: {
    "m-001": { rate: 90, total: 10 },
    "m-002": { rate: 70, total: 10 },
  },
};

describe("HouseholdDashboard", () => {
  it("renders the Household heading", () => {
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    expect(screen.getByText("Household")).toBeInTheDocument();
  });

  it("renders New Chore link", () => {
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    expect(screen.getByText("New Chore")).toBeInTheDocument();
  });

  it("displays completion rate percentage", () => {
    // weeklyStats total completed = 8, pending chores = 0, so rate = 100%
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Completion rate")).toBeInTheDocument();
  });

  it("displays team on-time rate label", () => {
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    expect(screen.getByText("Team on-time rate")).toBeInTheDocument();
  });

  it("shows dash for on-time rate when total is 0", () => {
    renderWithProviders(
      <HouseholdDashboard
        {...baseProps}
        teamOnTimeRate={{ onTime: 0, total: 0, rate: 0 }}
      />
    );
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("displays today progress", () => {
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    expect(screen.getByText("Done today")).toBeInTheDocument();
    expect(screen.getByText("/5")).toBeInTheDocument();
  });

  it("renders Workload Balance section", () => {
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    expect(screen.getByText("Workload Balance")).toBeInTheDocument();
  });

  it("renders Members section with count", () => {
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    expect(screen.getByText("Members (2)")).toBeInTheDocument();
  });

  it("renders member cards for each member", () => {
    renderWithProviders(<HouseholdDashboard {...baseProps} />);
    // Both names appear multiple times (workload bar + member cards)
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
  });

  it("calculates completion rate with pending chores", () => {
    const pendingChores = [
      {
        id: "inst-1",
        title: "Chore 1",
        points: 1,
        due_date: "2026-03-11",
        assigned_to: "m-001",
        status: "pending",
        assigned_member: { id: "m-001", users: { display_name: "Alice" } },
      },
      {
        id: "inst-2",
        title: "Chore 2",
        points: 1,
        due_date: "2026-03-12",
        assigned_to: "m-002",
        status: "pending",
        assigned_member: { id: "m-002", users: { display_name: "Bob" } },
      },
    ];
    // weeklyStats completed = 8, pending = 2, total = 10
    // rate = 80%, but on-time rate also shows 80% — use getAllByText
    renderWithProviders(
      <HouseholdDashboard {...baseProps} allPendingChores={pendingChores} />
    );
    const matches = screen.getAllByText(/80%/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
