import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileCard } from "./profile-card";

vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn(),
}));

const defaultProps = {
  displayName: "Alice Smith",
  email: "alice@example.com",
  avatarUrl: null,
  householdName: "Casa de Amigos",
  role: "member" as const,
  memberSince: "2025-06-15T00:00:00Z",
};

describe("ProfileCard", () => {
  it("renders display name", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("renders email", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("renders initials when no avatar URL", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders avatar image when avatarUrl is provided", () => {
    render(
      <ProfileCard {...defaultProps} avatarUrl="https://example.com/photo.jpg" />
    );
    const img = screen.getByAltText("Alice Smith");
    expect(img).toBeInTheDocument();
  });

  it("shows Member badge for member role", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("shows Admin badge for admin role", () => {
    render(<ProfileCard {...defaultProps} role="admin" />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders household name", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("Casa de Amigos")).toBeInTheDocument();
  });

  it("formats member since date", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("June 2025")).toBeInTheDocument();
  });

  it("renders sign out button", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("renders Household label", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("Household")).toBeInTheDocument();
  });

  it("renders Member since label", () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText("Member since")).toBeInTheDocument();
  });
});
