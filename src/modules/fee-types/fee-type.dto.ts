import { z } from "zod";

export const createFeeTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateFeeTypeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type CreateFeeTypeInput = z.infer<typeof createFeeTypeSchema>;
export type UpdateFeeTypeInput = z.infer<typeof updateFeeTypeSchema>;
