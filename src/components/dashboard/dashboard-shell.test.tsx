import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardShell } from "./dashboard-shell";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    const React = require("react");
    return React.createElement("a", { href, ...props }, children);
  },
}));

// Mock sub-components to isolate testing
vi.mock("./sidebar-nav", () => ({
  SidebarNav: ({ onNavigate }: { onNavigate: () => void }) => (
    <nav data-testid="sidebar-nav">
      <button onClick={onNavigate}>Nav Item</button>
    </nav>
  ),
}));

vi.mock("./top-bar", () => ({
  TopBar: ({
    userName,
    onMenuToggle,
  }: {
    userName: string;
    onMenuToggle: () => void;
  }) => (
    <div data-testid="top-bar">
      <span>{userName}</span>
      <button onClick={onMenuToggle} aria-label="toggle menu">
        Menu
      </button>
    </div>
  ),
}));

const defaultProps = {
  household: {
    id: "h-001",
    name: "Test Household",
    invite_code: "ABC123",
    timezone: "America/New_York",
  },
  membership: {
    memberId: "m-001",
    householdId: "h-001",
    userId: "u-001",
    role: "admin" as const,
  },
  user: {
    display_name: "Alice",
    avatar_url: null,
  },
};

describe("DashboardShell", () => {
  it("renders NestSync brand", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText("NestSync")).toBeInTheDocument();
  });

  it("renders household name in sidebar", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    // Household name appears in both sidebar and topbar
    expect(screen.getAllByText("Test Household").length).toBeGreaterThanOrEqual(
      1
    );
  });

  it("renders children content", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Dashboard Content</div>
      </DashboardShell>
    );
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  it("renders user display name", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders sidebar navigation", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId("sidebar-nav")).toBeInTheDocument();
  });

  it("renders top bar", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId("top-bar")).toBeInTheDocument();
  });

  it("shows admin role in sidebar footer", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText(/Admin/)).toBeInTheDocument();
  });

  it("shows member role when not admin", () => {
    const memberProps = {
      ...defaultProps,
      membership: { ...defaultProps.membership, role: "member" as const },
    };
    render(
      <DashboardShell {...memberProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText(/Member/)).toBeInTheDocument();
  });

  it("opens sidebar when menu toggle is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    // Initially sidebar is closed (has -translate-x-full)
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("-translate-x-full");

    // Click menu toggle
    await user.click(screen.getByLabelText("toggle menu"));

    // Sidebar should now be open (translate-x-0)
    expect(aside?.className).toContain("translate-x-0");
  });

  it("closes sidebar when overlay is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    // Open sidebar first
    await user.click(screen.getByLabelText("toggle menu"));
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("translate-x-0");

    // Click overlay to close
    const overlay = container.querySelector(".fixed.inset-0");
    if (overlay) await user.click(overlay);

    expect(aside?.className).toContain("-translate-x-full");
  });

  it("renders NestSync text logo in sidebar", () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText("NestSync")).toBeInTheDocument();
  });
});
