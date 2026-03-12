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

  it("renders all items as links", () => {
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
    const votesLink = screen.getByText("Votes").closest("a");
    expect(votesLink).toHaveAttribute("href", "/dashboard/votes");
  });

  it("does not show any 'Soon' badges when all items are enabled", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    expect(screen.queryByText("Soon")).toBeNull();
  });

  it("highlights Home when on /dashboard", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.className).toContain("bg-primary-light");
  });

  it("highlights My Page when on /dashboard/my", () => {
    mockPathname.mockReturnValue("/dashboard/my");
    render(<SidebarNav />);
    const myPageLink = screen.getByText("My Page").closest("a");
    expect(myPageLink?.className).toContain("bg-primary-light");
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.className).not.toContain("bg-primary-light");
  });

  it("highlights Calendar when on /dashboard/calendar", () => {
    mockPathname.mockReturnValue("/dashboard/calendar");
    render(<SidebarNav />);
    const calendarLink = screen.getByText("Calendar").closest("a");
    expect(calendarLink?.className).toContain("bg-primary-light");
  });

  it("calls onNavigate when a link is clicked", () => {
    mockPathname.mockReturnValue("/dashboard");
    const onNavigate = vi.fn();
    render(<SidebarNav onNavigate={onNavigate} />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/dashboard");
  });
});
