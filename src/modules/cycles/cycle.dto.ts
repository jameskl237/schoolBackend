import { z } from "zod";

export const createCycleSchema = z.object({
  sectionId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  code: z.string().min(1),
});

export const updateCycleSchema = z.object({
  sectionId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;
