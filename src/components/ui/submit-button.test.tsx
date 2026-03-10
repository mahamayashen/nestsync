import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmitButton } from "./submit-button";

// Mock useFormStatus
const mockUseFormStatus = vi.fn();
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: () => mockUseFormStatus(),
  };
});

describe("SubmitButton", () => {
  it("renders children as button text", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });
    render(<SubmitButton>Submit</SubmitButton>);
    expect(screen.getByRole("button")).toHaveTextContent("Submit");
  });

  it("is a submit button", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });
    render(<SubmitButton>Go</SubmitButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("disables button when form is pending", () => {
    mockUseFormStatus.mockReturnValue({ pending: true });
    render(<SubmitButton>Submit</SubmitButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("sets aria-busy when pending", () => {
    mockUseFormStatus.mockReturnValue({ pending: true });
    render(<SubmitButton>Submit</SubmitButton>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("is enabled when not pending", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });
    render(<SubmitButton>Submit</SubmitButton>);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });
});
