import { describe, it, expect } from "vitest";
import {
  createChoreTemplateSchema,
  completeChoreSchema,
  deleteChoreTemplateSchema,
} from "./validation";
import { TEST_UUID } from "@/test/helpers";

describe("createChoreTemplateSchema", () => {
  const validInput = {
    title: "Clean kitchen",
    description: "Wipe counters and mop floor",
    points: 5,
    recurrence: "weekly" as const,
    assignedTo: TEST_UUID,
  };

  it("accepts valid input", () => {
    const result = createChoreTemplateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts empty string description (optional)", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined description (optional)", () => {
    const { description, ...noDesc } = validInput;
    const result = createChoreTemplateSchema.safeParse(noDesc);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 200 characters", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at exactly 200 characters", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      title: "a".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejects points less than 1", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      points: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects points greater than 100", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      points: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer points", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      points: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it("coerces string points to number", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      points: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.points).toBe(5);
    }
  });

  it("rejects invalid recurrence", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      recurrence: "yearly",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid recurrence values", () => {
    for (const recurrence of ["one_time", "daily", "weekly", "monthly"]) {
      const result = createChoreTemplateSchema.safeParse({
        ...validInput,
        recurrence,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid UUID for assignedTo", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      assignedTo: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than 2000 characters", () => {
    const result = createChoreTemplateSchema.safeParse({
      ...validInput,
      description: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("completeChoreSchema", () => {
  it("accepts valid UUID", () => {
    const result = completeChoreSchema.safeParse({ instanceId: TEST_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID format", () => {
    const result = completeChoreSchema.safeParse({
      instanceId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing instanceId", () => {
    const result = completeChoreSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = completeChoreSchema.safeParse({ instanceId: "" });
    expect(result.success).toBe(false);
  });
});

describe("deleteChoreTemplateSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteChoreTemplateSchema.safeParse({
      templateId: TEST_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID format", () => {
    const result = deleteChoreTemplateSchema.safeParse({
      templateId: "bad-id",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing templateId", () => {
    const result = deleteChoreTemplateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = deleteChoreTemplateSchema.safeParse({ templateId: "" });
    expect(result.success).toBe(false);
  });
});
