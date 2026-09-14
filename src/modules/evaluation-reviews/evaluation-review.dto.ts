import { z } from "zod";

import { ReviewDecision } from "../../generated/prisma/enums.js";

export const createReviewSchema = z
  .object({
    decision: z.enum(ReviewDecision),
    comment: z.string().min(1).optional(),
  })
  .refine((input) => input.decision === "APPROVED" || Boolean(input.comment), {
    message: "A comment is required when requesting changes",
    path: ["comment"],
  });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
