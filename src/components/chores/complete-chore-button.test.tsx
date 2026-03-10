import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompleteChoreButton } from "./complete-chore-button";
import { renderWithProviders } from "@/test/helpers";

// Mock the server action
const mockCompleteChore = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/chores/actions", () => ({
  completeChore: (...args: unknown[]) => mockCompleteChore(...args),
}));

describe("CompleteChoreButton", () => {
  it("renders Done text", () => {
    renderWithProviders(
      <CompleteChoreButton instanceId="inst-001" householdId="h-001" />
    );
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("has accessible aria-label", () => {
    renderWithProviders(
      <CompleteChoreButton instanceId="inst-001" householdId="h-001" />
    );
    expect(
      screen.getByRole("button", { name: /mark this chore as complete/i })
    ).toBeInTheDocument();
  });

  it("calls completeChore when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompleteChoreButton instanceId="inst-001" householdId="h-001" />
    );
    await user.click(
      screen.getByRole("button", { name: /mark this chore as complete/i })
    );
    expect(mockCompleteChore).toHaveBeenCalled();
  });

  it("disables button while mutation is pending", async () => {
    // Make the action never resolve
    mockCompleteChore.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(
      <CompleteChoreButton instanceId="inst-001" householdId="h-001" />
    );
    await user.click(
      screen.getByRole("button", { name: /mark this chore as complete/i })
    );
    expect(
      screen.getByRole("button", { name: /mark this chore as complete/i })
    ).toBeDisabled();
  });
});
