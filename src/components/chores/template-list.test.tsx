import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { TemplateList } from "./template-list";
import { renderWithProviders } from "@/test/helpers";

// Hoisted mutable resolver so individual tests can control query resolution
const { mockThenImpl } = vi.hoisted(() => ({
  mockThenImpl: vi.fn(),
}));

vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.is = () => chain;
      chain.order = () => chain;
      Object.defineProperty(chain, "then", {
        value: (resolve: (val: unknown) => void) => mockThenImpl(resolve),
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

// Reset to never-resolve before each test so existing tests are unaffected
beforeEach(() => {
  mockThenImpl.mockImplementation(() => {
    /* never calls resolve – initialData is used */
  });
});

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

  // --- queryFn coverage tests ---

  it("renders templates fetched from resolved query", async () => {
    const resolvedTemplates = [
      {
        id: "tpl-100",
        title: "Server Template",
        description: "From server",
        points: 3,
        recurrence: "weekly",
        assigned_member: null,
        creator: { id: "member-1", users: { display_name: "Alice" } },
      },
    ];
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({ data: resolvedTemplates })
    );
    renderWithProviders(
      <TemplateList
        initialTemplates={[]}
        currentMemberId="member-1"
        memberRole="admin"
        membersCanEditOwnChores={true}
        householdId="h-001"
      />
    );
    await waitFor(() => {
      expect(screen.getByText("Server Template")).toBeInTheDocument();
    });
  });

  it("falls back to empty array and shows empty state when query returns null", async () => {
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({ data: null })
    );
    renderWithProviders(
      <TemplateList
        initialTemplates={[]}
        currentMemberId="member-1"
        memberRole="admin"
        membersCanEditOwnChores={true}
        householdId="h-001"
      />
    );
    await waitFor(() => {
      expect(screen.getByText("No chore templates yet")).toBeInTheDocument();
    });
  });
});
