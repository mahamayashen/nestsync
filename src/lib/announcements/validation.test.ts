import { describe, it, expect } from "vitest";
import {
  ALLOWED_EMOJIS,
  EMOJI_MAP,
  createAnnouncementSchema,
  togglePinSchema,
  deleteAnnouncementSchema,
  toggleReactionSchema,
} from "./validation";
import { TEST_UUID } from "@/test/helpers";

describe("ALLOWED_EMOJIS", () => {
  it("exports a non-empty array", () => {
    expect(ALLOWED_EMOJIS.length).toBeGreaterThan(0);
  });

  it("contains expected emoji keys", () => {
    expect(ALLOWED_EMOJIS).toContain("thumbsup");
    expect(ALLOWED_EMOJIS).toContain("heart");
    expect(ALLOWED_EMOJIS).toContain("fire");
  });
});

describe("EMOJI_MAP", () => {
  it("has a visual emoji for every allowed key", () => {
    for (const key of ALLOWED_EMOJIS) {
      expect(EMOJI_MAP[key]).toBeDefined();
      expect(typeof EMOJI_MAP[key]).toBe("string");
    }
  });
});

describe("createAnnouncementSchema", () => {
  it("accepts valid content", () => {
    const result = createAnnouncementSchema.safeParse({ content: "Hello" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = createAnnouncementSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/empty/i);
    }
  });

  it("rejects content over 2000 characters", () => {
    const result = createAnnouncementSchema.safeParse({
      content: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/too long/i);
    }
  });

  it("accepts content at exactly 2000 characters", () => {
    const result = createAnnouncementSchema.safeParse({
      content: "a".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it("accepts content at exactly 1 character", () => {
    const result = createAnnouncementSchema.safeParse({ content: "x" });
    expect(result.success).toBe(true);
  });
});

describe("togglePinSchema", () => {
  it("accepts a valid UUID", () => {
    const result = togglePinSchema.safeParse({ announcementId: TEST_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    const result = togglePinSchema.safeParse({ announcementId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing announcementId", () => {
    const result = togglePinSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("deleteAnnouncementSchema", () => {
  it("accepts a valid UUID", () => {
    const result = deleteAnnouncementSchema.safeParse({
      announcementId: TEST_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    const result = deleteAnnouncementSchema.safeParse({
      announcementId: "bad",
    });
    expect(result.success).toBe(false);
  });
});

describe("toggleReactionSchema", () => {
  it("accepts valid UUID + allowed emoji", () => {
    const result = toggleReactionSchema.safeParse({
      announcementId: TEST_UUID,
      emoji: "thumbsup",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid emoji", () => {
    const result = toggleReactionSchema.safeParse({
      announcementId: TEST_UUID,
      emoji: "not-a-valid-emoji",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID with valid emoji", () => {
    const result = toggleReactionSchema.safeParse({
      announcementId: "bad-uuid",
      emoji: "heart",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all allowed emojis", () => {
    for (const emoji of ALLOWED_EMOJIS) {
      const result = toggleReactionSchema.safeParse({
        announcementId: TEST_UUID,
        emoji,
      });
      expect(result.success).toBe(true);
    }
  });
});
