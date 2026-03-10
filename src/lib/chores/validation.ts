import { z } from "zod";

export const createChoreTemplateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z
    .string()
    .max(2000, "Description too long")
    .optional()
    .or(z.literal("")),
  points: z.coerce
    .number()
    .int()
    .min(1, "Points must be at least 1")
    .max(100, "Points must be at most 100"),
  recurrence: z.enum(["one_time", "daily", "weekly", "monthly"]),
  assignedTo: z.string().uuid("Invalid assignee"),
});

export const completeChoreSchema = z.object({
  instanceId: z.string().uuid("Invalid chore instance"),
});

export const deleteChoreTemplateSchema = z.object({
  templateId: z.string().uuid("Invalid template"),
});

export type CreateChoreTemplateInput = z.infer<
  typeof createChoreTemplateSchema
>;
export type CompleteChoreInput = z.infer<typeof completeChoreSchema>;
export type DeleteChoreTemplateInput = z.infer<
  typeof deleteChoreTemplateSchema
>;
