import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createHouseholdSchema,
  joinHouseholdSchema,
  updateProfileSchema,
  updateEmailSchema,
  changePasswordSchema,
} from "./validation";

// ---- loginSchema ----

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "password123" });
    expect(result.success).toBe(false);
  });
});

// ---- signupSchema ----

describe("signupSchema", () => {
  const validInput = {
    email: "new@example.com",
    password: "secure123",
    displayName: "Test User",
  };

  it("accepts valid input", () => {
    const result = signupSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("accepts password of exactly 6 characters", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects displayName shorter than 2 characters", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      displayName: "A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects displayName longer than 100 characters", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      displayName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts displayName at exactly 100 characters", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      displayName: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      email: "bad-email",
    });
    expect(result.success).toBe(false);
  });
});

// ---- forgotPasswordSchema ----

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

// ---- resetPasswordSchema ----

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "",
    });
    // Fails refine (mismatch)
    expect(result.success).toBe(false);
  });
});

// ---- createHouseholdSchema ----

describe("createHouseholdSchema", () => {
  it("accepts valid input", () => {
    const result = createHouseholdSchema.safeParse({
      name: "My House",
      timezone: "America/New_York",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createHouseholdSchema.safeParse({
      name: "",
      timezone: "America/New_York",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    const result = createHouseholdSchema.safeParse({
      name: "N".repeat(101),
      timezone: "America/New_York",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty timezone", () => {
    const result = createHouseholdSchema.safeParse({
      name: "My House",
      timezone: "",
    });
    expect(result.success).toBe(false);
  });
});

// ---- joinHouseholdSchema ----

describe("joinHouseholdSchema", () => {
  it("accepts valid code", () => {
    const result = joinHouseholdSchema.safeParse({
      inviteCode: "ABC12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty code", () => {
    const result = joinHouseholdSchema.safeParse({ inviteCode: "" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace", () => {
    const result = joinHouseholdSchema.safeParse({
      inviteCode: "  ABC123  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inviteCode).toBe("ABC123");
    }
  });

  it("rejects code longer than 20 characters", () => {
    const result = joinHouseholdSchema.safeParse({
      inviteCode: "A".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("accepts code at exactly 20 characters", () => {
    const result = joinHouseholdSchema.safeParse({
      inviteCode: "A".repeat(20),
    });
    expect(result.success).toBe(true);
  });
});

// ---- updateProfileSchema ----

describe("updateProfileSchema", () => {
  it("accepts valid display name", () => {
    const result = updateProfileSchema.safeParse({ displayName: "Alice" });
    expect(result.success).toBe(true);
  });

  it("rejects display name shorter than 2 characters", () => {
    const result = updateProfileSchema.safeParse({ displayName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects display name longer than 100 characters", () => {
    const result = updateProfileSchema.safeParse({
      displayName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts display name at exactly 2 characters", () => {
    const result = updateProfileSchema.safeParse({ displayName: "AB" });
    expect(result.success).toBe(true);
  });
});

// ---- updateEmailSchema ----

describe("updateEmailSchema", () => {
  it("accepts valid email", () => {
    const result = updateEmailSchema.safeParse({ email: "new@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = updateEmailSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = updateEmailSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

// ---- changePasswordSchema ----

describe("changePasswordSchema", () => {
  const validInput = {
    currentPassword: "oldpass123",
    newPassword: "newpass123",
    confirmPassword: "newpass123",
  };

  it("accepts valid input with matching passwords", () => {
    const result = changePasswordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      currentPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects new password shorter than 6 characters", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("accepts new password at exactly 6 characters", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(true);
  });
});
