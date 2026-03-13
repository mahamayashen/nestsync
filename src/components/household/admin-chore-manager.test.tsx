import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { AdminChoreManager } from "./admin-chore-manager";

const mockDeleteChoreTemplate = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/lib/chores/actions", () => ({
  reassignChore: vi.fn().mockResolvedValue({ success: true }),
  deleteChoreTemplate: (...args: unknown[]) => mockDeleteChoreTemplate(...args),
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

const templates = [
  {
    id: "t1",
    title: "Clean Kitchen",
    description: null,
    points: 5,
    recurrence: "daily" as const,
    schedule_days: [1, 2, 3, 4, 5] as number[],
    assigned_member: {
      id: "m1",
      users: { display_name: "Alice" },
    },
    creator: {
      id: "m1",
      users: { display_name: "Alice" },
    },
  },
  {
    id: "t2",
    title: "Vacuum",
    description: null,
    points: 3,
    recurrence: "weekly" as const,
    schedule_days: [1] as number[],
    assigned_member: {
      id: "m2",
      users: { display_name: "Bob" },
    },
    creator: {
      id: "m1",
      users: { display_name: "Alice" },
    },
  },
];

const defaultProps = {
  householdId: "h1",
  members,
  initialTemplates: templates,
};

describe("AdminChoreManager", () => {
  it("renders Manage Chores heading", () => {
    renderWithProviders(<AdminChoreManager {...defaultProps} />);
    expect(screen.getByText("Manage Chores")).toBeInTheDocument();
  });

  it("renders template titles", () => {
    renderWithProviders(<AdminChoreManager {...defaultProps} />);
    expect(screen.getByText("Clean Kitchen")).toBeInTheDocument();
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
  });

  it("shows schedule info for templates", () => {
    renderWithProviders(<AdminChoreManager {...defaultProps} />);
    // t1 has schedule_days [1,2,3,4,5] = Mon, Tue, Wed, Thu, Fri
    expect(screen.getByText(/Mon, Tue, Wed, Thu, Fri/)).toBeInTheDocument();
    // t2 has schedule_days [1] = Mon
    expect(screen.getByText(/Mon · 3 pts/)).toBeInTheDocument();
  });

  it("shows assigned member names in template info", () => {
    renderWithProviders(<AdminChoreManager {...defaultProps} />);
    // Alice and Bob appear in both the filter dropdown and template rows
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
  });

  it("renders member filter dropdown", () => {
    renderWithProviders(<AdminChoreManager {...defaultProps} />);
    expect(screen.getByText("All members")).toBeInTheDocument();
  });

  it("filters templates by member", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChoreManager {...defaultProps} />);

    // Select Bob from the filter
    const filterSelect = screen.getByDisplayValue("All members");
    await user.selectOptions(filterSelect, "m2");

    // Only Vacuum (assigned to Bob) should be visible
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
    expect(screen.queryByText("Clean Kitchen")).not.toBeInTheDocument();
  });

  it("returns null when templates list is empty", () => {
    const { container } = renderWithProviders(
      <AdminChoreManager {...defaultProps} initialTemplates={[]} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders reassign and delete buttons", () => {
    renderWithProviders(<AdminChoreManager {...defaultProps} />);
    const reassignButtons = screen.getAllByTitle("Reassign");
    const deleteButtons = screen.getAllByTitle("Delete");
    expect(reassignButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it("shows reassign dropdown when reassign is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChoreManager {...defaultProps} />);

    const reassignButtons = screen.getAllByTitle("Reassign");
    await user.click(reassignButtons[0]);

    expect(screen.getByText("Assign to...")).toBeInTheDocument();
  });

  it("shows delete confirmation when delete is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChoreManager {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle("Delete");
    await user.click(deleteButtons[0]);

    expect(screen.getByText("Delete?")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("cancels delete confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChoreManager {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle("Delete");
    await user.click(deleteButtons[0]);

    expect(screen.getByText("Delete?")).toBeInTheDocument();
    await user.click(screen.getByText("Cancel"));

    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
  });

  it("shows Daily for templates with all 7 days", () => {
    const dailyTemplates = [
      {
        ...templates[0],
        schedule_days: [0, 1, 2, 3, 4, 5, 6] as number[],
      },
    ];
    renderWithProviders(
      <AdminChoreManager {...defaultProps} initialTemplates={dailyTemplates} />
    );
    expect(screen.getByText(/Daily/)).toBeInTheDocument();
  });

  it("shows One-time for one_time recurrence", () => {
    const oneTimeTemplates = [
      {
        ...templates[0],
        recurrence: "one_time" as const,
        schedule_days: null,
      },
    ];
    renderWithProviders(
      <AdminChoreManager {...defaultProps} initialTemplates={oneTimeTemplates} />
    );
    expect(screen.getByText(/One-time/)).toBeInTheDocument();
  });

  it("shows legacy recurrence for templates without schedule_days", () => {
    const legacyTemplates = [
      {
        ...templates[0],
        recurrence: "weekly" as const,
        schedule_days: null,
      },
    ];
    renderWithProviders(
      <AdminChoreManager {...defaultProps} initialTemplates={legacyTemplates} />
    );
    expect(screen.getByText(/weekly/)).toBeInTheDocument();
  });

  it("shows Unassigned for templates without assigned_member", () => {
    const unassignedTemplates = [
      {
        ...templates[0],
        assigned_member: null,
      },
    ];
    renderWithProviders(
      <AdminChoreManager
        {...defaultProps}
        initialTemplates={unassignedTemplates}
      />
    );
    expect(screen.getByText(/Unassigned/)).toBeInTheDocument();
  });

  it("shows error message when delete fails", async () => {
    mockDeleteChoreTemplate.mockResolvedValueOnce({
      error: "Delete failed: permission denied",
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminChoreManager {...defaultProps} />);

    // Click delete icon, then confirm with "Yes"
    const deleteButtons = screen.getAllByTitle("Delete");
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(
      await screen.findByText("Delete failed: permission denied")
    ).toBeInTheDocument();
  });
});
