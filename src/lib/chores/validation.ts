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
  scheduleDays: z
    .array(z.coerce.number().int().min(0).max(6))
    .optional()
    .nullable(),
  dueDate: z.string().optional().nullable(),
  assignedTo: z.string().uuid("Please select a member to assign this chore to"),
});

export const completeChoreSchema = z.object({
  instanceId: z.string().uuid("Invalid chore instance"),
});

export const deleteChoreTemplateSchema = z.object({
  templateId: z.string().uuid("Invalid template"),
});

export const reassignChoreSchema = z.object({
  templateId: z.string().uuid("Invalid template"),
  newAssignee: z.string().uuid("Invalid member"),
});

export type CreateChoreTemplateInput = z.infer<
  typeof createChoreTemplateSchema
>;
export type CompleteChoreInput = z.infer<typeof completeChoreSchema>;
export type DeleteChoreTemplateInput = z.infer<
  typeof deleteChoreTemplateSchema
>;
export type ReassignChoreInput = z.infer<typeof reassignChoreSchema>;
