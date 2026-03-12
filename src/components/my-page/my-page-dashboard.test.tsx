import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import { MyPageDashboard } from "./my-page-dashboard";

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

// Use local date computation matching the component
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

const today = localDateStr(new Date());

const baseChore = {
  id: "inst-001",
  title: "Clean Kitchen",
  points: 3,
  due_date: dateOffset(2),
  assigned_to: "m-001",
  status: "pending",
  assigned_member: {
    id: "m-001",
    users: { display_name: "Alice" },
  },
};

const baseProps = {
  userName: "Alice",
  householdId: "h-001",
  currentMemberId: "m-001",
  myPendingChores: [],
  myStreak: 5,
  onTimeRate: { onTime: 9, total: 10, rate: 90 },
  weekComparison: { thisWeek: 15, lastWeek: 10, diff: 5 },
};

describe("MyPageDashboard", () => {
  it("renders My Page heading", () => {
    renderWithProviders(<MyPageDashboard {...baseProps} />);
    expect(screen.getByText("My Page")).toBeInTheDocument();
  });

  it("renders user name in subtitle", () => {
    renderWithProviders(<MyPageDashboard {...baseProps} />);
    expect(
      screen.getByText(/Alice.* personal stats/i)
    ).toBeInTheDocument();
  });

  it("renders New Chore link", () => {
    renderWithProviders(<MyPageDashboard {...baseProps} />);
    expect(screen.getByText("New Chore")).toBeInTheDocument();
  });

  it("displays streak with days label", () => {
    renderWithProviders(<MyPageDashboard {...baseProps} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("days")).toBeInTheDocument();
    expect(screen.getByText("My streak")).toBeInTheDocument();
  });

  it("uses singular 'day' for streak of 1", () => {
    renderWithProviders(
      <MyPageDashboard {...baseProps} myStreak={1} />
    );
    expect(screen.getByText("day")).toBeInTheDocument();
  });

  it("displays on-time rate percentage", () => {
    renderWithProviders(<MyPageDashboard {...baseProps} />);
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("On-time rate")).toBeInTheDocument();
  });

  it("shows dash for on-time rate when total is 0", () => {
    renderWithProviders(
      <MyPageDashboard
        {...baseProps}
        onTimeRate={{ onTime: 0, total: 0, rate: 0 }}
      />
    );
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("displays positive weekly trend", () => {
    renderWithProviders(<MyPageDashboard {...baseProps} />);
    expect(screen.getByText("+5 pts")).toBeInTheDocument();
    expect(screen.getByText("vs last week")).toBeInTheDocument();
  });

  it("displays negative weekly trend", () => {
    renderWithProviders(
      <MyPageDashboard
        {...baseProps}
        weekComparison={{ thisWeek: 5, lastWeek: 10, diff: -5 }}
      />
    );
    expect(screen.getByText("-5 pts")).toBeInTheDocument();
  });

  it("displays 'Same' for zero diff", () => {
    renderWithProviders(
      <MyPageDashboard
        {...baseProps}
        weekComparison={{ thisWeek: 10, lastWeek: 10, diff: 0 }}
      />
    );
    expect(screen.getByText("Same")).toBeInTheDocument();
  });

  it("shows today's chores section when applicable", () => {
    const todayChore = { ...baseChore, due_date: today };
    renderWithProviders(
      <MyPageDashboard
        {...baseProps}
        myPendingChores={[todayChore]}
      />
    );
    expect(screen.getByText(/Due Today/)).toBeInTheDocument();
  });

  it("shows overdue section for past-due chores", () => {
    const overdueChore = { ...baseChore, due_date: dateOffset(-2) };
    renderWithProviders(
      <MyPageDashboard
        {...baseProps}
        myPendingChores={[overdueChore]}
      />
    );
    // Overdue appears in section header and in the chore card
    expect(screen.getAllByText(/Overdue/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows upcoming section", () => {
    const upcomingChore = { ...baseChore, due_date: dateOffset(3) };
    renderWithProviders(
      <MyPageDashboard
        {...baseProps}
        myPendingChores={[upcomingChore]}
      />
    );
    expect(screen.getByText(/Upcoming \(1\)/)).toBeInTheDocument();
  });

  it("shows empty state when no upcoming chores", () => {
    renderWithProviders(<MyPageDashboard {...baseProps} />);
    expect(
      screen.getByText(/no upcoming chores/i)
    ).toBeInTheDocument();
  });
});
