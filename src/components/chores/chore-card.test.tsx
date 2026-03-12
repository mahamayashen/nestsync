import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import { ChoreCard } from "./chore-card";

// Mock server action
vi.mock("@/lib/chores/actions", () => ({
  completeChore: vi.fn(),
}));

// Use local date (matching the component's date computation)
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const today = localDateStr(new Date());

// Helper to create a date string offset from today
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

const baseInstance = {
  id: "inst-001",
  title: "Wash Dishes",
  points: 3,
  due_date: dateOffset(2), // 2 days from now
  assigned_to: "member-001",
  status: "pending",
  assigned_member: {
    id: "member-001",
    users: { display_name: "Alice" },
  },
};

describe("ChoreCard", () => {
  it("renders title", () => {
    renderWithProviders(
      <ChoreCard instance={baseInstance} householdId="h-001" />
    );
    expect(screen.getByText("Wash Dishes")).toBeInTheDocument();
  });

  it("renders points badge", () => {
    renderWithProviders(
      <ChoreCard instance={baseInstance} householdId="h-001" />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders assignee name", () => {
    renderWithProviders(
      <ChoreCard instance={baseInstance} householdId="h-001" />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows 'Unassigned' when no assigned member", () => {
    const unassigned = { ...baseInstance, assigned_member: null };
    renderWithProviders(
      <ChoreCard instance={unassigned} householdId="h-001" />
    );
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("shows complete button when status is pending", () => {
    renderWithProviders(
      <ChoreCard instance={baseInstance} householdId="h-001" />
    );
    expect(
      screen.getByRole("button", { name: /complete/i })
    ).toBeInTheDocument();
  });

  it("hides complete button when status is completed", () => {
    const completed = { ...baseInstance, status: "completed" };
    renderWithProviders(
      <ChoreCard instance={completed} householdId="h-001" />
    );
    expect(
      screen.queryByRole("button", { name: /complete/i })
    ).not.toBeInTheDocument();
  });

  it("shows 'Today' prefix for today's chore", () => {
    const todayInstance = { ...baseInstance, due_date: today };
    renderWithProviders(
      <ChoreCard instance={todayInstance} householdId="h-001" />
    );
    expect(screen.getByText(/Today/)).toBeInTheDocument();
  });

  it("shows 'Overdue' prefix for past chores", () => {
    const overdueInstance = { ...baseInstance, due_date: dateOffset(-3) };
    renderWithProviders(
      <ChoreCard instance={overdueInstance} householdId="h-001" />
    );
    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });

  it("renders date in readable format", () => {
    renderWithProviders(
      <ChoreCard instance={baseInstance} householdId="h-001" />
    );
    // The date should be formatted (e.g., "Mar 12" or similar)
    const dateStr = new Date(
      baseInstance.due_date + "T00:00:00"
    ).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    expect(screen.getByText(new RegExp(dateStr))).toBeInTheDocument();
  });
});
