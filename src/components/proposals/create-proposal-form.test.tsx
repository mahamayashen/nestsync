import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import { CreateProposalForm } from "./create-proposal-form";

vi.mock("@/lib/proposals/actions", () => ({
  createProposal: vi.fn().mockResolvedValue({ success: true }),
}));

const members = [
  {
    id: "m1",
    household_id: "h1",
    user_id: "u1",
    role: "admin" as const,
    joined_at: "2020-01-01",
    left_at: null,
    users: { display_name: "Alice", email: "alice@test.com", avatar_url: null },
  },
  {
    id: "m2",
    household_id: "h1",
    user_id: "u2",
    role: "member" as const,
    joined_at: "2020-02-01",
    left_at: null,
    users: { display_name: "Bob", email: "bob@test.com", avatar_url: null },
  },
];

describe("CreateProposalForm", () => {
  it("shows New Proposal button initially", () => {
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );
    expect(screen.getByText("New Proposal")).toBeInTheDocument();
  });

  it("opens form when New Proposal is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    expect(screen.getByRole("heading", { name: "Create Proposal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("shows type selector with three options", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    expect(screen.getByText("Admin Election")).toBeInTheDocument();
    expect(screen.getByText("Remove Member")).toBeInTheDocument();
    expect(screen.getByText("Custom Vote")).toBeInTheDocument();
  });

  it("shows target member dropdown for elect_admin type", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    await user.click(screen.getByText("Admin Election"));
    expect(screen.getByLabelText("Nominee")).toBeInTheDocument();
    // Admin should not appear in election nominees
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows target member dropdown for remove_member type", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    await user.click(screen.getByText("Remove Member"));
    expect(screen.getByLabelText("Member to remove")).toBeInTheDocument();
  });

  it("hides target member dropdown for custom type", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    // Custom is default, no target dropdown
    expect(screen.queryByLabelText("Nominee")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Member to remove")
    ).not.toBeInTheDocument();
  });

  it("closes form when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    expect(screen.getByRole("heading", { name: "Create Proposal" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Cancel"));
    expect(screen.getByText("New Proposal")).toBeInTheDocument();
  });

  it("disables submit when title is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    const submitBtn = screen.getByRole("button", { name: /Create Proposal/ });
    expect(submitBtn).toBeDisabled();
  });

  it("shows voting period field", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateProposalForm
        householdId="h1"
        members={members}
        currentMemberRole="admin"
      />
    );

    await user.click(screen.getByText("New Proposal"));
    expect(screen.getByLabelText(/Voting period/)).toBeInTheDocument();
  });
});
