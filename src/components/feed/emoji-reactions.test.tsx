import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { EmojiReactions } from "./emoji-reactions";

vi.mock("@/lib/announcements/actions", () => ({
  toggleReaction: vi.fn().mockResolvedValue({ success: true }),
}));

const baseProps = {
  announcementId: "ann-001",
  currentMemberId: "m-001",
  householdId: "h-001",
  reactions: [] as { id: string; emoji: string; member_id: string }[],
};

describe("EmojiReactions", () => {
  it("renders add reaction button", () => {
    renderWithProviders(<EmojiReactions {...baseProps} />);
    expect(screen.getByLabelText("Add reaction")).toBeInTheDocument();
  });

  it("shows no reaction buttons when reactions is empty", () => {
    renderWithProviders(<EmojiReactions {...baseProps} />);
    // Only the add button should be present, no grouped reaction buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1); // Just the "Add reaction" button
  });

  it("groups and displays reactions with counts", () => {
    const reactions = [
      { id: "r-1", emoji: "heart", member_id: "m-001" },
      { id: "r-2", emoji: "heart", member_id: "m-002" },
      { id: "r-3", emoji: "fire", member_id: "m-001" },
    ];
    renderWithProviders(
      <EmojiReactions {...baseProps} reactions={reactions} />
    );
    // Heart count = 2, fire count = 1
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("toggles emoji picker when add button is clicked", async () => {
    renderWithProviders(<EmojiReactions {...baseProps} />);
    const addButton = screen.getByLabelText("Add reaction");
    await userEvent.click(addButton);
    // Picker should show all emoji options
    expect(screen.getByLabelText("thumbsup")).toBeInTheDocument();
    expect(screen.getByLabelText("heart")).toBeInTheDocument();
    expect(screen.getByLabelText("fire")).toBeInTheDocument();
  });

  it("closes picker when emoji is clicked", async () => {
    renderWithProviders(<EmojiReactions {...baseProps} />);
    const addButton = screen.getByLabelText("Add reaction");
    await userEvent.click(addButton);
    // Click an emoji
    await userEvent.click(screen.getByLabelText("thumbsup"));
    // Picker should be closed
    expect(screen.queryByLabelText("laugh")).not.toBeInTheDocument();
  });
});
