import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { WeeklyCalendar } from "./weekly-calendar";

vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  }),
}));

vi.mock("@/lib/chores/actions", () => ({
  createChoreQuick: vi.fn().mockResolvedValue({ success: true }),
  ensureWeekInstancesAction: vi.fn().mockResolvedValue(undefined),
}));

const baseProps = {
  householdId: "h-001",
  currentMemberId: "m-001",
  currentRole: "member" as const,
  members: [
    { id: "m-001", user_id: "u1", role: "member", joined_at: "", users: { display_name: "Alice", avatar_url: null } },
    { id: "m-002", user_id: "u2", role: "member", joined_at: "", users: { display_name: "Bob", avatar_url: null } },
  ],
  initialEvents: [] as never[],
  initialWeekStart: "2026-03-09", // Monday
  memberMap: { "m-001": "Alice", "m-002": "Bob" },
};

describe("WeeklyCalendar", () => {
  it("renders Calendar heading", () => {
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    expect(
      screen.getByText(/weekly schedule/i)
    ).toBeInTheDocument();
  });

  it("renders all 7 day headers", () => {
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("renders day numbers for the week", () => {
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    // Mar 9 (Mon) to Mar 15 (Sun)
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    expect(
      screen.getByText(/no events scheduled/i)
    ).toBeInTheDocument();
  });

  it("renders events on the correct day", () => {
    const events = [
      {
        event_id: "e-001",
        household_id: "h-001",
        event_type: "chore",
        event_title: "Vacuum Living Room",
        event_date: "2026-03-10",
        event_status: "pending",
        related_member_id: "m-001",
        metadata_int: 3,
        metadata_decimal: null,
        member_display_name: "Alice",
      },
    ];
    renderWithProviders(
      <WeeklyCalendar {...baseProps} initialEvents={events} />
    );
    expect(screen.getByText("Vacuum Living Room")).toBeInTheDocument();
  });

  it("renders WeekNavigator component", () => {
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("shows week range in navigator", () => {
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    // Should display "Mar 9 – 15, 2026"
    expect(screen.getByText(/Mar 9/)).toBeInTheDocument();
  });

  it("navigates to previous week when prev button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    await user.click(screen.getByLabelText("Previous week"));
    // Should now show Mar 2 (Mon of previous week)
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/Mar 2/)).toBeInTheDocument();
  });

  it("navigates to next week when next button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    await user.click(screen.getByLabelText("Next week"));
    // Should now show Mar 16 (Mon of next week)
    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("returns to today when Today button is clicked after navigating", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    // Navigate forward
    await user.click(screen.getByLabelText("Next week"));
    // Click today
    await user.click(screen.getByText("Today"));
    // Should show the current week's Monday based on actual date
    const today = new Date();
    expect(screen.getByText(String(today.getDate()))).toBeInTheDocument();
  });

  it("shows quick-add form when a day header is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    // Click on Monday (day 9) header area
    await user.click(screen.getByText("9"));
    expect(screen.getByText("Quick add")).toBeInTheDocument();
  });

  it("hides quick-add when the same day is clicked again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    await user.click(screen.getByText("9"));
    expect(screen.getByText("Quick add")).toBeInTheDocument();
    await user.click(screen.getByText("9"));
    expect(screen.queryByText("Quick add")).not.toBeInTheDocument();
  });

  it("hides quick-add when navigating weeks", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeeklyCalendar {...baseProps} />);
    await user.click(screen.getByText("9"));
    expect(screen.getByText("Quick add")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Next week"));
    expect(screen.queryByText("Quick add")).not.toBeInTheDocument();
  });
});
