import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateChoreForm } from "./create-chore-form";

// Hoisted mock so individual tests can control the return value
const { mockCreateChoreTemplate } = vi.hoisted(() => ({
  mockCreateChoreTemplate: vi.fn(),
}));

vi.mock("@/lib/chores/actions", () => ({
  createChoreTemplate: (...args: unknown[]) =>
    mockCreateChoreTemplate(...args),
}));

beforeEach(() => {
  // Default: action resolves to undefined → state stays as {}
  mockCreateChoreTemplate.mockResolvedValue(undefined);
});

const mockMembers = [
  { id: "member-1", user_id: "u1", household_id: "h1", role: "admin", joined_at: "", users: { display_name: "Alice", avatar_url: null } },
  { id: "member-2", user_id: "u2", household_id: "h1", role: "member", joined_at: "", users: { display_name: "Bob", avatar_url: null } },
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

  it("defaults assignee to first member", () => {
    render(<CreateChoreForm members={mockMembers} />);
    const assigneeSelect = screen.getByLabelText(/assigned to/i) as HTMLSelectElement;
    expect(assigneeSelect.value).toBe("member-1");
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

  it("shows error alert when createChoreTemplate returns an error", async () => {
    mockCreateChoreTemplate.mockResolvedValue({
      error: "Failed to create chore template",
    });
    const user = userEvent.setup();
    render(<CreateChoreForm members={mockMembers} />);
    await user.click(screen.getByRole("button", { name: /create chore/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Failed to create chore template")
    ).toBeInTheDocument();
  });
});
