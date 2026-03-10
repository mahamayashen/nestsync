import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { TemplateCard } from "./template-card";

// Mock the server action
const mockDeleteChoreTemplate = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/chores/actions", () => ({
  deleteChoreTemplate: (...args: unknown[]) => mockDeleteChoreTemplate(...args),
}));

const baseTemplate = {
  id: "tpl-001",
  title: "Clean Kitchen",
  description: "Wipe down counters and mop floors",
  points: 5,
  recurrence: "weekly",
  assigned_member: {
    id: "member-001",
    users: { display_name: "Alice" },
  },
  creator: {
    id: "member-002",
    users: { display_name: "Bob" },
  },
};

describe("TemplateCard", () => {
  it("renders title", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(screen.getByText("Clean Kitchen")).toBeInTheDocument();
  });

  it("renders description", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(
      screen.getByText("Wipe down counters and mop floors")
    ).toBeInTheDocument();
  });

  it("renders points badge", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(screen.getByText("5 points")).toBeInTheDocument();
  });

  it("renders recurrence badge", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("shows assignee name", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows 'Unassigned' when no assignee", () => {
    const noAssignee = { ...baseTemplate, assigned_member: null };
    renderWithProviders(
      <TemplateCard
        template={noAssignee}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("shows creator name", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(screen.getByText(/Created by Bob/)).toBeInTheDocument();
  });

  it("shows delete button when canDelete is true", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={true}
        householdId="h-001"
      />
    );
    expect(
      screen.getByRole("button", { name: /delete/i })
    ).toBeInTheDocument();
  });

  it("hides delete button when canDelete is false", () => {
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(
      screen.queryByRole("button", { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  it("renders singular 'point' for 1 point", () => {
    const onePoint = { ...baseTemplate, points: 1 };
    renderWithProviders(
      <TemplateCard
        template={onePoint}
        canDelete={false}
        householdId="h-001"
      />
    );
    expect(screen.getByText("1 point")).toBeInTheDocument();
  });

  it("calls deleteChoreTemplate when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TemplateCard
        template={baseTemplate}
        canDelete={true}
        householdId="h-001"
      />
    );
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(mockDeleteChoreTemplate).toHaveBeenCalled();
  });
});
