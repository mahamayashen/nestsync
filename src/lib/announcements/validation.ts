import { z } from "zod";

export const ALLOWED_EMOJIS = [
  "thumbsup",
  "heart",
  "laugh",
  "celebrate",
  "eyes",
  "fire",
] as const;

export const EMOJI_MAP: Record<(typeof ALLOWED_EMOJIS)[number], string> = {
  thumbsup: "\u{1F44D}",
  heart: "\u2764\uFE0F",
  laugh: "\u{1F602}",
  celebrate: "\u{1F389}",
  eyes: "\u{1F440}",
  fire: "\u{1F525}",
};

export const createAnnouncementSchema = z.object({
  content: z
    .string()
    .min(1, "Announcement cannot be empty")
    .max(2000, "Announcement is too long (max 2000 characters)"),
});

export const togglePinSchema = z.object({
  announcementId: z.string().uuid("Invalid announcement"),
});

export const deleteAnnouncementSchema = z.object({
  announcementId: z.string().uuid("Invalid announcement"),
});

export const toggleReactionSchema = z.object({
  announcementId: z.string().uuid("Invalid announcement"),
  emoji: z.enum(ALLOWED_EMOJIS, { message: "Invalid emoji" }),
});
