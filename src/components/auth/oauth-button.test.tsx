import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoogleOAuthButton } from "./oauth-button";

// Mock useSupabase
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

// Mock localStorage since jsdom's implementation is limited
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GoogleOAuthButton", () => {
  it("renders Google sign in button", () => {
    render(<GoogleOAuthButton />);
    expect(
      screen.getByRole("button", { name: /google/i })
    ).toBeInTheDocument();
  });

  it("calls signInWithOAuth when clicked", async () => {
    const user = userEvent.setup();
    render(<GoogleOAuthButton />);
    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" })
    );
  });

  it("stores invite code in localStorage when provided", async () => {
    const user = userEvent.setup();
    render(<GoogleOAuthButton inviteCode="TEST123" />);
    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "nestsync_invite_code",
      "TEST123"
    );
  });

  it("does not store invite code when not provided", async () => {
    const user = userEvent.setup();
    render(<GoogleOAuthButton />);
    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
});
