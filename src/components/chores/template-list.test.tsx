import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { TemplateList } from "./template-list";
import { renderWithProviders } from "@/test/helpers";

// Mock useSupabase — return a chain that never resolves so initialData is used
vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.is = () => chain;
      chain.order = () => chain;
      Object.defineProperty(chain, "then", {
        value: () => new Promise(() => {}),
        writable: true,
        configurable: true,
      });
      return chain;
    },
  }),
}));

// Mock TemplateCard to isolate this component
vi.mock("./template-card", () => ({
  TemplateCard: ({
    template,
    canDelete,
  }: {
    template: { title: string };
    canDelete: boolean;
  }) => (
    <div data-testid="template-card">
      {template.title}
      {canDelete && <span>deletable</span>}
    </div>
  ),
}));

const mockTemplates = [
  {
    id: "tpl-1",
    title: "Clean Kitchen",
    description: "Wipe counters",
    points: 5,
    recurrence: "weekly",
    assigned_member: { id: "member-1", users: { display_name: "Alice" } },
    creator: { id: "member-1", users: { display_name: "Alice" } },
  },
  {
    id: "tpl-2",
    title: "Take out trash",
    description: null,
    points: 2,
    recurrence: "daily",
    assigned_member: null,
    creator: { id: "member-2", users: { display_name: "Bob" } },
  },
];

describe("TemplateList", () => {
  it("renders templates", () => {
    renderWithProviders(
      <TemplateList
        initialTemplates={mockTemplates}
        currentMemberId="member-1"
        memberRole="admin"
        membersCanEditOwnChores={true}
        householdId="h-001"
      />
    );
    expect(screen.getByText("Clean Kitchen")).toBeInTheDocument();
    expect(screen.getByText("Take out trash")).toBeInTheDocument();
  });

  it("shows empty state when no templates", () => {
    renderWithProviders(
      <TemplateList
        initialTemplates={[]}
        currentMemberId="member-1"
        memberRole="admin"
        membersCanEditOwnChores={true}
        householdId="h-001"
      />
    );
    expect(screen.getByText("No chore templates yet")).toBeInTheDocument();
  });

  it("admin can delete all templates", () => {
    renderWithProviders(
      <TemplateList
        initialTemplates={mockTemplates}
        currentMemberId="member-1"
        memberRole="admin"
        membersCanEditOwnChores={false}
        householdId="h-001"
      />
    );
    const deletableMarkers = screen.getAllByText("deletable");
    expect(deletableMarkers).toHaveLength(2);
  });

  it("non-admin member can only delete own templates when setting enabled", () => {
    renderWithProviders(
      <TemplateList
        initialTemplates={mockTemplates}
        currentMemberId="member-1"
        memberRole="member"
        membersCanEditOwnChores={true}
        householdId="h-001"
      />
    );
    // member-1 created tpl-1, so only tpl-1 should be deletable
    const deletableMarkers = screen.getAllByText("deletable");
    expect(deletableMarkers).toHaveLength(1);
  });

  it("non-admin member cannot delete any when setting disabled", () => {
    renderWithProviders(
      <TemplateList
        initialTemplates={mockTemplates}
        currentMemberId="member-1"
        memberRole="member"
        membersCanEditOwnChores={false}
        householdId="h-001"
      />
    );
    expect(screen.queryByText("deletable")).not.toBeInTheDocument();
  });

  it("renders the correct number of template cards", () => {
    renderWithProviders(
      <TemplateList
        initialTemplates={mockTemplates}
        currentMemberId="member-1"
        memberRole="admin"
        membersCanEditOwnChores={true}
        householdId="h-001"
      />
    );
    const cards = screen.getAllByTestId("template-card");
    expect(cards).toHaveLength(2);
  });
});
