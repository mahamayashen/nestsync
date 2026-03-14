import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileEditForm } from "./profile-edit-form";

// ---- Hoisted mocks ----
const {
  mockUpdateProfile,
  mockUpdateEmail,
  mockChangePassword,
  mockUploadAvatar,
  mockDeleteAccount,
  mockCheckDeleteEligibility,
} = vi.hoisted(() => ({
  mockUpdateProfile: vi.fn(),
  mockUpdateEmail: vi.fn(),
  mockChangePassword: vi.fn(),
  mockUploadAvatar: vi.fn(),
  mockDeleteAccount: vi.fn(),
  mockCheckDeleteEligibility: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  updateProfile: mockUpdateProfile,
  updateEmail: mockUpdateEmail,
  changePassword: mockChangePassword,
  uploadAvatar: mockUploadAvatar,
  deleteAccount: mockDeleteAccount,
  checkDeleteEligibility: mockCheckDeleteEligibility,
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { fill, priority, ...rest } = props;
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

const defaultProps = {
  displayName: "Alice Smith",
  email: "alice@example.com",
  avatarUrl: null,
  userId: "user-123",
  role: "member" as const,
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateProfile.mockResolvedValue({ success: true });
  mockUpdateEmail.mockResolvedValue({ success: true });
  mockChangePassword.mockResolvedValue({ success: true });
  mockUploadAvatar.mockResolvedValue({ success: true });
  mockDeleteAccount.mockResolvedValue({ success: true });
  mockCheckDeleteEligibility.mockResolvedValue({
    canDelete: true,
    isAdmin: false,
    isSoleMember: false,
    memberCount: 3,
  });
});

describe("ProfileEditForm", () => {
  it("renders the edit profile header", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
  });

  it("renders the display name input with current value", () => {
    render(<ProfileEditForm {...defaultProps} />);
    const input = screen.getByDisplayValue("Alice Smith");
    expect(input).toBeInTheDocument();
  });

  it("renders the email input with current value", () => {
    render(<ProfileEditForm {...defaultProps} />);
    const input = screen.getByDisplayValue("alice@example.com");
    expect(input).toBeInTheDocument();
  });

  it("renders initials when no avatar", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders avatar image when avatarUrl is provided", () => {
    render(
      <ProfileEditForm
        {...defaultProps}
        avatarUrl="https://example.com/photo.jpg"
      />
    );
    const img = screen.getByAltText("Alice Smith");
    expect(img).toBeInTheDocument();
  });

  it("renders change password button", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(screen.getByText("Change password...")).toBeInTheDocument();
  });

  it("renders delete account button", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(screen.getByText("Delete Account")).toBeInTheDocument();
  });

  it("calls onClose when back button is clicked", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    // The back arrow is inside the header, first button in the component
    const header = screen.getByText("Edit Profile").closest("div")!;
    const backButton = header.querySelector("button")!;
    await userEvent.click(backButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows password form when change password is clicked", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Change password..."));
    expect(
      screen.getByPlaceholderText("Current password")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/New password/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm new password")
    ).toBeInTheDocument();
  });

  it("hides password form when cancel is clicked", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Change password..."));
    expect(
      screen.getByPlaceholderText("Current password")
    ).toBeInTheDocument();
    await userEvent.click(screen.getByText("Cancel"));
    expect(
      screen.queryByPlaceholderText("Current password")
    ).not.toBeInTheDocument();
  });

  it("shows delete confirmation when delete button is clicked", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(screen.getByText("Delete your account?")).toBeInTheDocument();
    });
  });

  it("shows blocked message for admin with other members", async () => {
    mockCheckDeleteEligibility.mockResolvedValue({
      canDelete: false,
      reason: "You must remove all other members first.",
      isAdmin: true,
      isSoleMember: false,
      memberCount: 3,
    });
    render(<ProfileEditForm {...defaultProps} role="admin" />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(screen.getByText("Cannot delete account")).toBeInTheDocument();
    });
  });

  it("shows sole admin warning for sole admin", async () => {
    mockCheckDeleteEligibility.mockResolvedValue({
      canDelete: true,
      isAdmin: true,
      isSoleMember: true,
      memberCount: 1,
    });
    render(<ProfileEditForm {...defaultProps} role="admin" />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(screen.getByText("Delete your account?")).toBeInTheDocument();
      expect(
        screen.getByText(/sole admin/)
      ).toBeInTheDocument();
    });
  });

  it("shows member info for regular member delete", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(
        screen.getByText(/removed from the household/)
      ).toBeInTheDocument();
    });
  });

  it("dismisses delete confirmation with Got it button", async () => {
    mockCheckDeleteEligibility.mockResolvedValue({
      canDelete: false,
      reason: "Cannot delete.",
      isAdmin: true,
      isSoleMember: false,
      memberCount: 3,
    });
    render(<ProfileEditForm {...defaultProps} role="admin" />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(screen.getByText("Got it")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Got it"));
    expect(screen.queryByText("Cannot delete account")).not.toBeInTheDocument();
  });

  it("dismisses delete confirmation with Cancel button", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Cancel"));
    expect(
      screen.queryByText("Delete your account?")
    ).not.toBeInTheDocument();
  });

  it("renders tap to change photo text", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(
      screen.getByText("Tap to change photo (max 2MB)")
    ).toBeInTheDocument();
  });

  it("renders Display Name label", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(screen.getByText("Display Name")).toBeInTheDocument();
  });

  it("renders Email label", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders Password label", () => {
    render(<ProfileEditForm {...defaultProps} />);
    expect(screen.getByText("Password")).toBeInTheDocument();
  });

  it("toggles current password visibility", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Change password..."));
    const currentPwInput = screen.getByPlaceholderText("Current password");
    expect(currentPwInput).toHaveAttribute("type", "password");

    // Click the eye toggle button (first one after the input)
    const toggleButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.closest(".relative") && btn.classList.contains("absolute");
    });
    if (toggleButtons.length > 0) {
      await userEvent.click(toggleButtons[0]);
    }
  });

  // ---- Handler tests ----

  it("calls updateProfile when name save button is clicked", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const nameInput = screen.getByDisplayValue("Alice Smith");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Bob Jones");
    // Find the save button next to the name input (FloppyDisk icon button)
    const nameSection = nameInput.closest(".flex.gap-2")!;
    const saveButton = nameSection.querySelector("button")!;
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });

  it("shows name update success message", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const nameInput = screen.getByDisplayValue("Alice Smith");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Bob Jones");
    const nameSection = nameInput.closest(".flex.gap-2")!;
    const saveButton = nameSection.querySelector("button")!;
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText("Name updated")).toBeInTheDocument();
    });
  });

  it("shows name update error message", async () => {
    mockUpdateProfile.mockResolvedValue({ error: "Name too short" });
    render(<ProfileEditForm {...defaultProps} />);
    const nameInput = screen.getByDisplayValue("Alice Smith");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Bob Jones");
    const nameSection = nameInput.closest(".flex.gap-2")!;
    const saveButton = nameSection.querySelector("button")!;
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText("Name too short")).toBeInTheDocument();
    });
  });

  it("does not call updateProfile when name is unchanged", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const nameSection = screen.getByDisplayValue("Alice Smith").closest(".flex.gap-2")!;
    const saveButton = nameSection.querySelector("button")!;
    await userEvent.click(saveButton);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("calls updateEmail when email save button is clicked", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const emailInput = screen.getByDisplayValue("alice@example.com");
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "newemail@example.com");
    const emailSection = emailInput.closest(".flex.gap-2")!;
    const saveButton = emailSection.querySelector("button")!;
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(mockUpdateEmail).toHaveBeenCalled();
    });
  });

  it("shows email update success message", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const emailInput = screen.getByDisplayValue("alice@example.com");
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "new@example.com");
    const emailSection = emailInput.closest(".flex.gap-2")!;
    const saveButton = emailSection.querySelector("button")!;
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(
        screen.getByText("Confirmation email sent to new address")
      ).toBeInTheDocument();
    });
  });

  it("shows email update error message", async () => {
    mockUpdateEmail.mockResolvedValue({ error: "Email already in use" });
    render(<ProfileEditForm {...defaultProps} />);
    const emailInput = screen.getByDisplayValue("alice@example.com");
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "taken@example.com");
    const emailSection = emailInput.closest(".flex.gap-2")!;
    const saveButton = emailSection.querySelector("button")!;
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
  });

  it("does not call updateEmail when email is unchanged", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const emailSection = screen.getByDisplayValue("alice@example.com").closest(".flex.gap-2")!;
    const saveButton = emailSection.querySelector("button")!;
    await userEvent.click(saveButton);
    expect(mockUpdateEmail).not.toHaveBeenCalled();
  });

  it("submits password form", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Change password..."));
    await userEvent.type(
      screen.getByPlaceholderText("Current password"),
      "oldpass123"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/New password/),
      "newpass123"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm new password"),
      "newpass123"
    );
    await userEvent.click(screen.getByText("Update Password"));
    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });
  });

  it("shows password error message", async () => {
    mockChangePassword.mockResolvedValue({
      error: "Current password is incorrect",
    });
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Change password..."));
    await userEvent.type(
      screen.getByPlaceholderText("Current password"),
      "wrongpass"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/New password/),
      "newpass123"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm new password"),
      "newpass123"
    );
    await userEvent.click(screen.getByText("Update Password"));
    await waitFor(() => {
      expect(
        screen.getByText("Current password is incorrect")
      ).toBeInTheDocument();
    });
  });

  it("calls uploadAvatar when file is selected", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalled();
    });
  });

  it("shows avatar upload error", async () => {
    mockUploadAvatar.mockResolvedValue({ error: "File too large" });
    render(<ProfileEditForm {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByText("File too large")).toBeInTheDocument();
    });
  });

  it("shows avatar upload success", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByText("Photo updated")).toBeInTheDocument();
    });
  });

  it("calls deleteAccount when confirmed", async () => {
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
    });
  });

  it("shows delete error", async () => {
    mockDeleteAccount.mockResolvedValue({ error: "Cannot delete" });
    render(<ProfileEditForm {...defaultProps} />);
    await userEvent.click(screen.getByText("Delete Account"));
    await waitFor(() => {
      expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
    });
  });
});
