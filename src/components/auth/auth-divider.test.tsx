import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthDivider } from "./auth-divider";

describe("AuthDivider", () => {
  it("renders 'or' text", () => {
    render(<AuthDivider />);
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("renders a divider line", () => {
    const { container } = render(<AuthDivider />);
    expect(container.querySelector(".border-t")).toBeInTheDocument();
  });
});
