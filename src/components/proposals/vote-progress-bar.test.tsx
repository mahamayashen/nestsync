import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoteProgressBar } from "./vote-progress-bar";

describe("VoteProgressBar", () => {
  it("renders yes/no counts", () => {
    render(
      <VoteProgressBar
        yesCount={3}
        noCount={1}
        eligibleVoterCount={5}
        participationThreshold={0.5}
      />
    );
    expect(screen.getByText("3 Yes")).toBeInTheDocument();
    expect(screen.getByText("1 No")).toBeInTheDocument();
  });

  it("shows remaining voters when not all voted", () => {
    render(
      <VoteProgressBar
        yesCount={2}
        noCount={1}
        eligibleVoterCount={5}
        participationThreshold={0.5}
      />
    );
    expect(screen.getByText("2 Remaining")).toBeInTheDocument();
  });

  it("hides remaining when all voted", () => {
    render(
      <VoteProgressBar
        yesCount={3}
        noCount={2}
        eligibleVoterCount={5}
        participationThreshold={0.5}
      />
    );
    expect(screen.queryByText(/Remaining/)).not.toBeInTheDocument();
  });

  it("displays quorum percentage", () => {
    render(
      <VoteProgressBar
        yesCount={0}
        noCount={0}
        eligibleVoterCount={10}
        participationThreshold={0.5}
      />
    );
    expect(screen.getByText("Quorum: 50%")).toBeInTheDocument();
  });

  it("handles zero eligible voters", () => {
    render(
      <VoteProgressBar
        yesCount={0}
        noCount={0}
        eligibleVoterCount={0}
        participationThreshold={0.5}
      />
    );
    expect(screen.getByText("Quorum: 50%")).toBeInTheDocument();
    expect(screen.getByText("0 Yes")).toBeInTheDocument();
  });
});
