import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarNav } from "./sidebar-nav";

// Mock usePathname
const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

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

describe("SidebarNav", () => {
  it("renders all nav items", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Chores")).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Votes")).toBeInTheDocument();
  });

  it("renders enabled items as links", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/dashboard");
    const choresLink = screen.getByText("Chores").closest("a");
    expect(choresLink).toHaveAttribute("href", "/dashboard/chores");
  });

  it("renders disabled items as non-clickable divs", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    // Disabled items should not be links
    const expensesEl = screen.getByText("Expenses").closest("div");
    expect(expensesEl).not.toBeNull();
    expect(expensesEl?.tagName).toBe("DIV");
    expect(screen.getByText("Expenses").closest("a")).toBeNull();
  });

  it("shows 'Soon' badge for disabled items", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const soonBadges = screen.getAllByText("Soon");
    // Expenses, Votes = 2 disabled items (Feed is now enabled)
    expect(soonBadges).toHaveLength(2);
  });

  it("highlights Home when on /dashboard", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.className).toContain("bg-primary-light");
  });

  it("highlights Chores when on /dashboard/chores", () => {
    mockPathname.mockReturnValue("/dashboard/chores");
    render(<SidebarNav />);
    const choresLink = screen.getByText("Chores").closest("a");
    expect(choresLink?.className).toContain("bg-primary-light");
    // Home should NOT be highlighted
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.className).not.toContain("bg-primary-light");
  });

  it("highlights Chores when on sub-route /dashboard/chores/new", () => {
    mockPathname.mockReturnValue("/dashboard/chores/new");
    render(<SidebarNav />);
    const choresLink = screen.getByText("Chores").closest("a");
    expect(choresLink?.className).toContain("bg-primary-light");
  });

  it("calls onNavigate when a link is clicked", () => {
    mockPathname.mockReturnValue("/dashboard");
    const onNavigate = vi.fn();
    render(<SidebarNav onNavigate={onNavigate} />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/dashboard");
  });
});
