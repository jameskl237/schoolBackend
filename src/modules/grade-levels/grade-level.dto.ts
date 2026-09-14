import { z } from "zod";

export const createGradeLevelSchema = z.object({
  cycleId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  code: z.string().min(1),
});

export const updateGradeLevelSchema = z.object({
  cycleId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

export type CreateGradeLevelInput = z.infer<typeof createGradeLevelSchema>;
export type UpdateGradeLevelInput = z.infer<typeof updateGradeLevelSchema>;
