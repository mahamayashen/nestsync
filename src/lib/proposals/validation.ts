import { z } from "zod";

export const PROPOSAL_TYPES = ["elect_admin", "remove_member", "custom"] as const;

export const createProposalSchema = z
  .object({
    type: z.enum(PROPOSAL_TYPES),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title too long"),
    description: z
      .string()
      .max(2000, "Description too long")
      .optional()
      .or(z.literal("")),
    targetMemberId: z.string().uuid("Invalid member").optional().nullable(),
    durationHours: z.coerce
      .number()
      .int()
      .min(1, "Duration must be at least 1 hour")
      .max(168, "Duration cannot exceed 7 days")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === "elect_admin" || data.type === "remove_member") {
        return !!data.targetMemberId;
      }
      return true;
    },
    {
      message: "Please select a target member",
      path: ["targetMemberId"],
    }
  );

export const castVoteSchema = z.object({
  proposalId: z.string().uuid("Invalid proposal"),
  vote: z.enum(["yes", "no"]),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
