import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import { AnnouncementFeed } from "./announcement-feed";
import type { AnnouncementWithDetails } from "@/lib/announcements/queries";

vi.mock("@/hooks/use-supabase", () => ({
  useSupabase: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  }),
}));

vi.mock("@/lib/announcements/actions", () => ({
  createAnnouncement: vi.fn().mockResolvedValue({ success: true }),
  togglePinAnnouncement: vi.fn().mockResolvedValue({ success: true }),
  deleteAnnouncement: vi.fn().mockResolvedValue({ success: true }),
  toggleReaction: vi.fn().mockResolvedValue({ success: true }),
}));

const mockAnnouncement: AnnouncementWithDetails = {
  id: "ann-001",
  household_id: "h-001",
  author_id: "m-001",
  content: "Welcome to our household!",
  is_pinned: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  author: {
    id: "m-001",
    role: "admin",
    users: { display_name: "Alice", avatar_url: null },
  },
  reactions: [],
};

const baseProps = {
  householdId: "h-001",
  currentMemberId: "m-001",
  currentMemberRole: "admin" as const,
};

describe("AnnouncementFeed", () => {
  it("renders empty state when no announcements", () => {
    renderWithProviders(
      <AnnouncementFeed {...baseProps} initialAnnouncements={[]} />
    );
    expect(screen.getByText("No announcements yet")).toBeInTheDocument();
    expect(
      screen.getByText(/be the first to share/i)
    ).toBeInTheDocument();
  });

  it("renders announcements when provided", () => {
    renderWithProviders(
      <AnnouncementFeed
        {...baseProps}
        initialAnnouncements={[mockAnnouncement]}
      />
    );
    expect(
      screen.getByText("Welcome to our household!")
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders create announcement form", () => {
    renderWithProviders(
      <AnnouncementFeed {...baseProps} initialAnnouncements={[]} />
    );
    expect(
      screen.getByPlaceholderText(/share an update/i)
    ).toBeInTheDocument();
  });

  it("renders multiple announcements", () => {
    const second: AnnouncementWithDetails = {
      ...mockAnnouncement,
      id: "ann-002",
      content: "Second post here!",
      author: {
        id: "m-002",
        role: "member",
        users: { display_name: "Bob", avatar_url: null },
      },
    };
    renderWithProviders(
      <AnnouncementFeed
        {...baseProps}
        initialAnnouncements={[mockAnnouncement, second]}
      />
    );
    expect(
      screen.getByText("Welcome to our household!")
    ).toBeInTheDocument();
    expect(screen.getByText("Second post here!")).toBeInTheDocument();
  });
});
