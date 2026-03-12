import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickAddChore } from "./quick-add-chore";

vi.mock("@/lib/chores/actions", () => ({
  createChoreQuick: vi.fn().mockResolvedValue({ success: true }),
}));

const members = [
  {
    id: "m1",
    user_id: "u1",
    household_id: "h1",
    role: "admin" as const,
    joined_at: "",
    left_at: null,
    users: { display_name: "Alice", email: "a@t.com", avatar_url: null },
  },
  {
    id: "m2",
    user_id: "u2",
    household_id: "h1",
    role: "member" as const,
    joined_at: "",
    left_at: null,
    users: { display_name: "Bob", email: "b@t.com", avatar_url: null },
  },
];

const defaultProps = {
  date: "2026-03-15",
  householdId: "h1",
  currentMemberId: "m1",
  currentRole: "admin" as const,
  members,
  onClose: vi.fn(),
  onCreated: vi.fn(),
};

describe("QuickAddChore", () => {
  it("renders Quick add label", () => {
    render(<QuickAddChore {...defaultProps} />);
    expect(screen.getByText("Quick add")).toBeInTheDocument();
  });

  it("renders chore name input", () => {
    render(<QuickAddChore {...defaultProps} />);
    expect(screen.getByPlaceholderText("Chore name")).toBeInTheDocument();
  });

  it("renders Add submit button", () => {
    render(<QuickAddChore {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Add" })
    ).toBeInTheDocument();
  });

  it("renders points input with default value 1", () => {
    render(<QuickAddChore {...defaultProps} />);
    const pointsInput = screen.getByDisplayValue("1");
    expect(pointsInput).toBeInTheDocument();
  });

  it("renders pts label", () => {
    render(<QuickAddChore {...defaultProps} />);
    expect(screen.getByText("pts")).toBeInTheDocument();
  });

  it("shows member select for admin role", () => {
    render(<QuickAddChore {...defaultProps} currentRole="admin" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("hides member select visually for non-admin role", () => {
    render(
      <QuickAddChore {...defaultProps} currentRole="member" currentMemberId="m2" />
    );
    // Select is still in DOM (for form submission) but visually hidden with sr-only
    const select = screen.getByRole("combobox", { hidden: true });
    expect(select).toHaveAttribute("aria-hidden", "true");
    expect(select.className).toContain("sr-only");
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QuickAddChore {...defaultProps} onClose={onClose} />);

    // Find the X close button (it's the button with no text besides the icon)
    const buttons = screen.getAllByRole("button");
    const closeBtn = buttons.find(
      (b) => b.textContent?.trim() !== "Add"
    );
    if (closeBtn) await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QuickAddChore {...defaultProps} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
