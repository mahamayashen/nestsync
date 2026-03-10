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
  myPendingCount: 5,
  totalPendingCount: 12,
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
};

describe("DashboardHome", () => {
  it("renders welcome message with user name", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText(/welcome back, alice/i)).toBeInTheDocument();
  });

  it("shows my pending chores count", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("My pending chores")).toBeInTheDocument();
    // "5" appears both as pending count and as a chore points badge
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
  });

  it("shows due today count", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Due today")).toBeInTheDocument();
  });

  it("shows total household chores count", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Total household chores")).toBeInTheDocument();
  });

  it("renders today's chore items", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("Clean kitchen")).toBeInTheDocument();
    expect(screen.getByText("Vacuum living room")).toBeInTheDocument();
  });

  it("shows assignee name for today's chores", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows 'Unassigned' for chores without assignee", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders view all link", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute(
      "href",
      "/dashboard/chores"
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

  it("shows chore points in badge", () => {
    render(<DashboardHome {...defaultProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
