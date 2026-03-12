import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { AnnouncementCard } from "./announcement-card";
import type { AnnouncementWithDetails } from "@/lib/announcements/queries";

vi.mock("@/lib/announcements/actions", () => ({
  togglePinAnnouncement: vi.fn().mockResolvedValue({ success: true }),
  deleteAnnouncement: vi.fn().mockResolvedValue({ success: true }),
  toggleReaction: vi.fn().mockResolvedValue({ success: true }),
}));

const baseAnnouncement: AnnouncementWithDetails = {
  id: "ann-001",
  household_id: "h-001",
  author_id: "m-001",
  content: "Hello everyone, welcome to NestSync!",
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
  announcement: baseAnnouncement,
  currentMemberId: "m-001",
  currentMemberRole: "admin" as const,
  householdId: "h-001",
};

describe("AnnouncementCard", () => {
  it("renders announcement content", () => {
    renderWithProviders(<AnnouncementCard {...baseProps} />);
    expect(
      screen.getByText("Hello everyone, welcome to NestSync!")
    ).toBeInTheDocument();
  });

  it("renders author name", () => {
    renderWithProviders(<AnnouncementCard {...baseProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders author initial avatar", () => {
    renderWithProviders(<AnnouncementCard {...baseProps} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders relative time as 'Just now' for recent announcements", () => {
    renderWithProviders(<AnnouncementCard {...baseProps} />);
    expect(screen.getByText("Just now")).toBeInTheDocument();
  });

  it("renders relative time in minutes", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        announcement={{ ...baseAnnouncement, created_at: fiveMinAgo }}
      />
    );
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("renders relative time in hours", () => {
    const threeHoursAgo = new Date(
      Date.now() - 3 * 60 * 60 * 1000
    ).toISOString();
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        announcement={{ ...baseAnnouncement, created_at: threeHoursAgo }}
      />
    );
    expect(screen.getByText("3h ago")).toBeInTheDocument();
  });

  it("renders 'Yesterday' for 1 day ago", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        announcement={{ ...baseAnnouncement, created_at: yesterday }}
      />
    );
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("renders days ago for 2-6 days", () => {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000
    ).toISOString();
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        announcement={{ ...baseAnnouncement, created_at: threeDaysAgo }}
      />
    );
    expect(screen.getByText("3d ago")).toBeInTheDocument();
  });

  it("shows pinned badge when is_pinned is true", () => {
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        announcement={{ ...baseAnnouncement, is_pinned: true }}
      />
    );
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it("does not show pinned badge when is_pinned is false", () => {
    renderWithProviders(<AnnouncementCard {...baseProps} />);
    expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
  });

  it("shows actions menu button for admin", () => {
    renderWithProviders(<AnnouncementCard {...baseProps} />);
    expect(
      screen.getByLabelText("Announcement actions")
    ).toBeInTheDocument();
  });

  it("shows actions menu button for author (non-admin)", () => {
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        currentMemberRole="member"
        currentMemberId="m-001"
      />
    );
    expect(
      screen.getByLabelText("Announcement actions")
    ).toBeInTheDocument();
  });

  it("hides actions menu for non-admin non-author", () => {
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        currentMemberRole="member"
        currentMemberId="m-other"
      />
    );
    expect(
      screen.queryByLabelText("Announcement actions")
    ).not.toBeInTheDocument();
  });

  it("shows Pin and Delete buttons in menu on click", async () => {
    renderWithProviders(<AnnouncementCard {...baseProps} />);
    await userEvent.click(screen.getByLabelText("Announcement actions"));
    expect(screen.getByText("Pin")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("shows Unpin when announcement is already pinned", async () => {
    renderWithProviders(
      <AnnouncementCard
        {...baseProps}
        announcement={{ ...baseAnnouncement, is_pinned: true }}
      />
    );
    await userEvent.click(screen.getByLabelText("Announcement actions"));
    expect(screen.getByText("Unpin")).toBeInTheDocument();
  });
});
