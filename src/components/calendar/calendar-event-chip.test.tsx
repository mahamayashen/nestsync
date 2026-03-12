import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarEventChip } from "./calendar-event-chip";

const baseEvent = {
  event_id: "evt-001",
  event_type: "chore",
  event_title: "Wash Dishes",
  event_status: "pending",
  metadata_int: 5,
  member_display_name: "Alice",
};

describe("CalendarEventChip", () => {
  it("renders the event title", () => {
    render(<CalendarEventChip event={baseEvent} />);
    expect(screen.getByText("Wash Dishes")).toBeInTheDocument();
  });

  it("shows points badge for chore events", () => {
    render(<CalendarEventChip event={baseEvent} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not show points badge for non-chore events", () => {
    render(
      <CalendarEventChip
        event={{ ...baseEvent, event_type: "expense", metadata_int: 5 }}
      />
    );
    // Points badge only shown for chore type
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("does not show points badge when metadata_int is null", () => {
    render(
      <CalendarEventChip event={{ ...baseEvent, metadata_int: null }} />
    );
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("shows member display name", () => {
    render(<CalendarEventChip event={baseEvent} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("does not show member name when null", () => {
    render(
      <CalendarEventChip
        event={{ ...baseEvent, member_display_name: null }}
      />
    );
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("applies opacity for completed events", () => {
    const { container } = render(
      <CalendarEventChip
        event={{ ...baseEvent, event_status: "completed" }}
      />
    );
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).toContain("opacity-50");
  });

  it("does not apply opacity for pending events", () => {
    const { container } = render(
      <CalendarEventChip event={baseEvent} />
    );
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).not.toContain("opacity-50");
  });

  it("includes title attribute with event title", () => {
    const { container } = render(
      <CalendarEventChip event={baseEvent} />
    );
    const chip = container.firstChild as HTMLElement;
    expect(chip.getAttribute("title")).toContain("Wash Dishes");
  });

  it("includes member name in title attribute", () => {
    const { container } = render(
      <CalendarEventChip event={baseEvent} />
    );
    const chip = container.firstChild as HTMLElement;
    expect(chip.getAttribute("title")).toContain("Alice");
  });
});
