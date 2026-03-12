import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekNavigator } from "./week-navigator";

const defaultProps = {
  weekStart: "2026-03-09", // Monday
  onPrevWeek: vi.fn(),
  onNextWeek: vi.fn(),
  onToday: vi.fn(),
};

describe("WeekNavigator", () => {
  it("renders the week range label", () => {
    render(<WeekNavigator {...defaultProps} />);
    // Mar 9 – 15, 2026 (same month)
    expect(screen.getByText(/Mar 9/)).toBeInTheDocument();
  });

  it("renders cross-month range correctly", () => {
    render(<WeekNavigator {...defaultProps} weekStart="2026-03-30" />);
    // Mar 30 – Apr 5, 2026 (cross-month)
    expect(screen.getByText(/Mar 30/)).toBeInTheDocument();
    expect(screen.getByText(/Apr 5/)).toBeInTheDocument();
  });

  it("renders Previous week button", () => {
    render(<WeekNavigator {...defaultProps} />);
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
  });

  it("renders Next week button", () => {
    render(<WeekNavigator {...defaultProps} />);
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
  });

  it("renders Today button", () => {
    render(<WeekNavigator {...defaultProps} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("calls onPrevWeek when previous button is clicked", async () => {
    const onPrevWeek = vi.fn();
    render(<WeekNavigator {...defaultProps} onPrevWeek={onPrevWeek} />);
    await userEvent.click(screen.getByLabelText("Previous week"));
    expect(onPrevWeek).toHaveBeenCalledOnce();
  });

  it("calls onNextWeek when next button is clicked", async () => {
    const onNextWeek = vi.fn();
    render(<WeekNavigator {...defaultProps} onNextWeek={onNextWeek} />);
    await userEvent.click(screen.getByLabelText("Next week"));
    expect(onNextWeek).toHaveBeenCalledOnce();
  });

  it("calls onToday when Today button is clicked", async () => {
    const onToday = vi.fn();
    render(<WeekNavigator {...defaultProps} onToday={onToday} />);
    await userEvent.click(screen.getByText("Today"));
    expect(onToday).toHaveBeenCalledOnce();
  });
});
