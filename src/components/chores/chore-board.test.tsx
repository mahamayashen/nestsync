import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoreBoard } from "./chore-board";
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

// Mock chore-card to avoid its internal complexity
vi.mock("./chore-card", () => ({
  ChoreCard: ({ instance }: { instance: { title: string } }) => (
    <div data-testid="chore-card">{instance.title}</div>
  ),
}));

// Reset to never-resolve before each test so existing tests are unaffected
beforeEach(() => {
  mockThenImpl.mockImplementation(() => {
    /* never calls resolve – initialData is used */
  });
});

const mockInstances = [
  {
    id: "inst-1",
    title: "Clean kitchen",
    points: 5,
    due_date: "2026-03-10",
    assigned_to: "member-1",
    status: "pending",
    assigned_member: { id: "member-1", users: { display_name: "Alice" } },
  },
  {
    id: "inst-2",
    title: "Take out trash",
    points: 2,
    due_date: "2026-03-11",
    assigned_to: null,
    status: "pending",
    assigned_member: null,
  },
  {
    id: "inst-3",
    title: "Mop floors",
    points: 3,
    due_date: "2026-03-12",
    assigned_to: "member-2",
    status: "pending",
    assigned_member: { id: "member-2", users: { display_name: "Bob" } },
  },
];

describe("ChoreBoard", () => {
  it("renders filter tabs", () => {
    renderWithProviders(
      <ChoreBoard
        initialInstances={mockInstances}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    expect(screen.getByText("My Chores")).toBeInTheDocument();
    expect(screen.getByText("All Chores")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("shows only my chores by default (mine filter)", () => {
    renderWithProviders(
      <ChoreBoard
        initialInstances={mockInstances}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    expect(screen.getByText("Clean kitchen")).toBeInTheDocument();
    expect(screen.queryByText("Take out trash")).not.toBeInTheDocument();
    expect(screen.queryByText("Mop floors")).not.toBeInTheDocument();
  });

  it("shows all chores when All Chores tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChoreBoard
        initialInstances={mockInstances}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    await user.click(screen.getByText("All Chores"));
    expect(screen.getByText("Clean kitchen")).toBeInTheDocument();
    expect(screen.getByText("Take out trash")).toBeInTheDocument();
    expect(screen.getByText("Mop floors")).toBeInTheDocument();
  });

  it("shows unassigned chores when Unassigned tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChoreBoard
        initialInstances={mockInstances}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    await user.click(screen.getByText("Unassigned"));
    expect(screen.getByText("Take out trash")).toBeInTheDocument();
    expect(screen.queryByText("Clean kitchen")).not.toBeInTheDocument();
  });

  it("shows empty state when no chores match mine filter", () => {
    renderWithProviders(
      <ChoreBoard
        initialInstances={[]}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    expect(
      screen.getByText("No chores assigned to you")
    ).toBeInTheDocument();
  });

  it("shows unassigned empty message", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChoreBoard
        initialInstances={[]}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    await user.click(screen.getByText("Unassigned"));
    expect(screen.getByText("No unassigned chores")).toBeInTheDocument();
  });

  it("shows all empty message", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChoreBoard
        initialInstances={[]}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    await user.click(screen.getByText("All Chores"));
    expect(screen.getByText("No pending chores")).toBeInTheDocument();
  });

  it("highlights active filter tab", () => {
    renderWithProviders(
      <ChoreBoard
        initialInstances={mockInstances}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    const myChoresBtn = screen.getByText("My Chores");
    expect(myChoresBtn.className).toContain("bg-surface");
  });

  // --- queryFn coverage tests ---

  it("renders instances fetched from resolved query", async () => {
    const resolvedInstances = [
      {
        id: "inst-100",
        title: "Fetched chore",
        points: 5,
        due_date: "2026-03-15",
        assigned_to: "member-1",
        status: "pending",
        assigned_member: { id: "member-1", users: { display_name: "Alice" } },
      },
    ];
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({ data: resolvedInstances })
    );
    renderWithProviders(
      <ChoreBoard
        initialInstances={[]}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    await waitFor(() => {
      expect(screen.getByText("Fetched chore")).toBeInTheDocument();
    });
  });

  it("falls back to empty array when query returns null data", async () => {
    mockThenImpl.mockImplementation((resolve: (val: unknown) => void) =>
      resolve({ data: null })
    );
    renderWithProviders(
      <ChoreBoard
        initialInstances={[]}
        currentMemberId="member-1"
        householdId="household-1"
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText("No chores assigned to you")
      ).toBeInTheDocument();
    });
  });
});
