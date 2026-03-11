import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardHome } from "./dashboard-home";

// Mock WeeklyStats to avoid its hooks
vi.mock("@/components/chores/weekly-stats", () => ({
  WeeklyStats: () => <div data-testid="weekly-stats">Weekly Stats Mock</div>,
}));

const defaultProps = {
  userName: "Alice",
  householdId: "h-001",
  todayChores: [
    {
      id: "inst-1",
      title: "Clean kitchen",
      points: 3,
      due_date: "2026-03-10",
      assigned_to: "m-1",
      assigned_member: { id: "m-1", users: { display_name: "Alice" } },
    },
    {
      id: "inst-2",
      title: "Vacuum living room",
      points: 5,
      due_date: "2026-03-10",
      assigned_to: null,
      assigned_member: null,
    },
  ],
  weeklyStats: [
    { memberId: "m-1", displayName: "Alice", points: 15, count: 3 },
  ],
  todayProgress: { completed: 2, total: 5 },
  householdStreak: 4,
};

describe("DashboardHome", () => {
  it("renders welcome message with user name", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText(/welcome back, alice/i)).toBeInTheDocument();
  });

  it("shows today's progress ring", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("Today's Progress")).toBeInTheDocument();
    expect(screen.getByText("3 remaining")).toBeInTheDocument();
  });

  it("shows household streak", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("Household streak")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows weekly MVP", () => {
    render(<DashboardHome {...defaultProps} />);
    // Alice is the MVP with 15 points (also appears as chore assignee)
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/15 pts/)).toBeInTheDocument();
  });

  it("shows no MVP message when no stats", () => {
    render(<DashboardHome {...defaultProps} weeklyStats={[]} />);
    expect(screen.getByText("No MVP yet")).toBeInTheDocument();
  });

  it("renders today's chore items", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("Clean kitchen")).toBeInTheDocument();
    expect(screen.getByText("Vacuum living room")).toBeInTheDocument();
  });

  it("shows 'Unassigned' for chores without assignee", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders view all link", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute(
      "href",
      "/dashboard/my"
    );
  });

  it("shows empty chores message when no today chores", () => {
    render(<DashboardHome {...defaultProps} todayChores={[]} />);
    expect(
      screen.getByText(/no chores due today/i)
    ).toBeInTheDocument();
  });

  it("renders WeeklyStats component", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByTestId("weekly-stats")).toBeInTheDocument();
  });

  it("shows all-done message when progress is complete", () => {
    render(
      <DashboardHome
        {...defaultProps}
        todayProgress={{ completed: 5, total: 5 }}
      />
    );
    expect(screen.getByText("All done! Great job!")).toBeInTheDocument();
  });
});
