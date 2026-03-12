import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { CreateAnnouncementForm } from "./create-announcement-form";

vi.mock("@/lib/announcements/actions", () => ({
  createAnnouncement: vi.fn().mockResolvedValue({ success: true }),
}));

describe("CreateAnnouncementForm", () => {
  it("renders textarea placeholder", () => {
    renderWithProviders(
      <CreateAnnouncementForm householdId="h-001" />
    );
    expect(
      screen.getByPlaceholderText(/share an update/i)
    ).toBeInTheDocument();
  });

  it("renders Post button", () => {
    renderWithProviders(
      <CreateAnnouncementForm householdId="h-001" />
    );
    expect(screen.getByText("Post")).toBeInTheDocument();
  });

  it("disables Post button when textarea is empty", () => {
    renderWithProviders(
      <CreateAnnouncementForm householdId="h-001" />
    );
    const button = screen.getByText("Post").closest("button")!;
    expect(button).toBeDisabled();
  });

  it("enables Post button when text is entered", async () => {
    renderWithProviders(
      <CreateAnnouncementForm householdId="h-001" />
    );
    const textarea = screen.getByPlaceholderText(/share an update/i);
    await userEvent.type(textarea, "Hello world");
    const button = screen.getByText("Post").closest("button")!;
    expect(button).not.toBeDisabled();
  });

  it("hides character counter below 1800 chars", () => {
    renderWithProviders(
      <CreateAnnouncementForm householdId="h-001" />
    );
    // Character counter should have invisible class when empty
    const counter = screen.getByText("0/2000");
    expect(counter.className).toContain("invisible");
  });

  it("shows character counter at 1800+ chars", async () => {
    renderWithProviders(
      <CreateAnnouncementForm householdId="h-001" />
    );
    const textarea = screen.getByPlaceholderText(/share an update/i);
    // Set value directly to avoid typing 1800 characters
    await userEvent.click(textarea);
    // Fire change event with large content
    const longText = "a".repeat(1801);
    // Use fireEvent for performance with large text
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(textarea, { target: { value: longText } });
    const counter = screen.getByText("1801/2000");
    expect(counter.className).not.toContain("invisible");
  });
});
