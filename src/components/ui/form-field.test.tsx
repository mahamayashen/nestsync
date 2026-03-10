import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("renders label and input", () => {
    render(
      <FormField id="test-id" label="Email" name="email" type="email" />
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email").tagName).toBe("INPUT");
  });

  it("passes name, type, and placeholder props", () => {
    render(
      <FormField
        id="test-id"
        label="Name"
        name="fullName"
        type="text"
        placeholder="Enter your name"
      />
    );
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("name", "fullName");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("placeholder", "Enter your name");
  });

  it("renders with defaultValue", () => {
    render(
      <FormField
        id="test-id"
        label="City"
        name="city"
        defaultValue="New York"
      />
    );
    expect(screen.getByLabelText("City")).toHaveValue("New York");
  });

  it("shows error message when error prop is provided", () => {
    render(
      <FormField
        id="test-id"
        label="Email"
        name="email"
        error="Invalid email"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("does not show error when no error prop", () => {
    render(
      <FormField id="test-id" label="Email" name="email" />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sets required attribute", () => {
    render(
      <FormField id="test-id" label="Email" name="email" required />
    );
    expect(screen.getByLabelText("Email")).toBeRequired();
  });

  it("defaults type to text", () => {
    render(<FormField id="test-id" label="Name" name="name" />);
    expect(screen.getByLabelText("Name")).toHaveAttribute("type", "text");
  });
});
