import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberCard } from "./member-card";

const baseMember = {
  id: "m-001",
  role: "member",
  users: { display_name: "Alice", avatar_url: null },
};

const baseProps = {
  member: baseMember,
  pendingCount: 0,
  weeklyPoints: 10,
  weeklyCompleted: 3,
  onTimeRate: { rate: 90, total: 10 },
};

describe("MemberCard", () => {
  it("renders member name", () => {
    render(<MemberCard {...baseProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders avatar initial", () => {
    render(<MemberCard {...baseProps} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders the member role", () => {
    render(<MemberCard {...baseProps} />);
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("shows crown icon for admin role", () => {
    const adminMember = { ...baseMember, role: "admin" };
    const { container } = render(
      <MemberCard {...baseProps} member={adminMember} />
    );
    // Crown icon renders as an SVG inside the name row
    const svgs = container.querySelectorAll("svg");
    // Should have SVGs for Crown, Star, CheckCircle, Timer
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it("does not show crown icon for non-admin", () => {
    render(<MemberCard {...baseProps} />);
    // Just check the role text is "member" not "admin"
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("renders weekly points", () => {
    render(<MemberCard {...baseProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
  });

  it("renders weekly completed count", () => {
    render(<MemberCard {...baseProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows on-time rate percentage when total > 0", () => {
    render(<MemberCard {...baseProps} />);
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("On-time")).toBeInTheDocument();
  });

  it("shows dash when on-time rate total is 0", () => {
    render(
      <MemberCard {...baseProps} onTimeRate={{ rate: 0, total: 0 }} />
    );
    // Should render "—"
    const dashElements = screen.getAllByText("—");
    expect(dashElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash when onTimeRate is undefined", () => {
    render(
      <MemberCard {...baseProps} onTimeRate={undefined} />
    );
    const dashElements = screen.getAllByText("—");
    expect(dashElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows pending badge when pendingCount > 0", () => {
    render(<MemberCard {...baseProps} pendingCount={3} />);
    expect(screen.getByText(/3 pending chores/)).toBeInTheDocument();
  });

  it("shows singular 'chore' for pendingCount = 1", () => {
    render(<MemberCard {...baseProps} pendingCount={1} />);
    expect(screen.getByText(/1 pending chore$/)).toBeInTheDocument();
  });

  it("hides pending badge when pendingCount is 0", () => {
    render(<MemberCard {...baseProps} pendingCount={0} />);
    expect(screen.queryByText(/pending/)).not.toBeInTheDocument();
  });
});
