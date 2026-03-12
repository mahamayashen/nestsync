import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";

// Mock the signOut action
vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn(),
}));

const defaultProps = {
  householdName: "Test Household",
  inviteCode: "ABC12345",
  userName: "Alice",
  avatarUrl: null as string | null,
  onMenuToggle: vi.fn(),
};

describe("TopBar", () => {
  it("renders household name", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText("Test Household")).toBeInTheDocument();
  });

  it("renders user name", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders sign out button", () => {
    render(<TopBar {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("renders invite button", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText("Invite")).toBeInTheDocument();
  });

  it("renders menu toggle button", () => {
    render(<TopBar {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /toggle sidebar/i })
    ).toBeInTheDocument();
  });

  it("calls onMenuToggle when menu button is clicked", async () => {
    const user = userEvent.setup();
    render(<TopBar {...defaultProps} />);
    await user.click(
      screen.getByRole("button", { name: /toggle sidebar/i })
    );
    expect(defaultProps.onMenuToggle).toHaveBeenCalled();
  });

  it("copies invite code when invite button is clicked", async () => {
    const user = userEvent.setup();
    // Mock clipboard API using Object.defineProperty for read-only navigator
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<TopBar {...defaultProps} />);
    await user.click(screen.getByText("Invite"));
    expect(writeText).toHaveBeenCalledWith("ABC12345");
  });

  it("shows 'Copied!' after copying invite code", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<TopBar {...defaultProps} />);
    await user.click(screen.getByText("Invite"));
    // After successful copy, button text changes
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("silently handles clipboard API failure", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<TopBar {...defaultProps} />);
    // Should not throw
    await user.click(screen.getByText("Invite"));
    // Invite button should still say "Invite" (not "Copied!")
    expect(screen.getByText("Invite")).toBeInTheDocument();
  });
});
