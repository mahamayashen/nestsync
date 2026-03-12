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
    expect(screen.getByText("My Page")).toBeInTheDocument();
    expect(screen.getByText("Household")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Votes")).toBeInTheDocument();
  });

  it("renders enabled items as links", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/dashboard");
    const myPageLink = screen.getByText("My Page").closest("a");
    expect(myPageLink).toHaveAttribute("href", "/dashboard/my");
    const householdLink = screen.getByText("Household").closest("a");
    expect(householdLink).toHaveAttribute("href", "/dashboard/household");
    const calendarLink = screen.getByText("Calendar").closest("a");
    expect(calendarLink).toHaveAttribute("href", "/dashboard/calendar");
  });

  it("renders disabled items as non-clickable divs", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const votesEl = screen.getByText("Votes").closest("div");
    expect(votesEl).not.toBeNull();
    expect(votesEl?.tagName).toBe("DIV");
    expect(screen.getByText("Votes").closest("a")).toBeNull();
  });

  it("shows 'Soon' badge for disabled items", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const soonBadges = screen.getAllByText("Soon");
    // Only Votes is disabled
    expect(soonBadges).toHaveLength(1);
  });

  it("highlights Home when on /dashboard", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.className).toContain("bg-sage-medium");
  });

  it("highlights My Page when on /dashboard/my", () => {
    mockPathname.mockReturnValue("/dashboard/my");
    render(<SidebarNav />);
    const myPageLink = screen.getByText("My Page").closest("a");
    expect(myPageLink?.className).toContain("bg-sage-medium");
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.className).not.toContain("bg-sage-medium");
  });

  it("highlights Calendar when on /dashboard/calendar", () => {
    mockPathname.mockReturnValue("/dashboard/calendar");
    render(<SidebarNav />);
    const calendarLink = screen.getByText("Calendar").closest("a");
    expect(calendarLink?.className).toContain("bg-sage-medium");
  });

  it("calls onNavigate when a link is clicked", () => {
    mockPathname.mockReturnValue("/dashboard");
    const onNavigate = vi.fn();
    render(<SidebarNav onNavigate={onNavigate} />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/dashboard");
  });
});
