import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateChoreForm } from "./create-chore-form";

// Mock server action
vi.mock("@/lib/chores/actions", () => ({
  createChoreTemplate: vi.fn(),
}));

const mockMembers = [
  { id: "member-1", user_id: "u1", household_id: "h1", role: "admin", joined_at: "", users: { display_name: "Alice", avatar_url: null, email: "alice@example.com" } },
  { id: "member-2", user_id: "u2", household_id: "h1", role: "member", joined_at: "", users: { display_name: "Bob", avatar_url: null, email: "bob@example.com" } },
];

describe("CreateChoreForm", () => {
  it("renders title field", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("renders description textarea", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("renders points field", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.getByLabelText(/points/i)).toBeInTheDocument();
  });

  it("renders recurrence select", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.getByLabelText(/recurrence/i)).toBeInTheDocument();
  });

  it("renders recurrence options", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.getByText("One-time")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("renders assignee select with members", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.getByLabelText(/assigned to/i)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders default 'Select a member' option", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.getByText("Select a member")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(
      screen.getByRole("button", { name: /create chore/i })
    ).toBeInTheDocument();
  });

  it("renders back to chore board link", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(
      screen.getByRole("link", { name: /back to chore board/i })
    ).toBeInTheDocument();
  });

  it("has correct default value for points", () => {
    render(<CreateChoreForm members={mockMembers} />);
    const pointsInput = screen.getByLabelText(/points/i) as HTMLInputElement;
    expect(pointsInput.defaultValue).toBe("1");
  });

  it("has correct default value for recurrence", () => {
    render(<CreateChoreForm members={mockMembers} />);
    const recurrenceSelect = screen.getByLabelText(
      /recurrence/i
    ) as HTMLSelectElement;
    expect(recurrenceSelect.value).toBe("weekly");
  });

  it("does not show error message on initial render", () => {
    render(<CreateChoreForm members={mockMembers} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
