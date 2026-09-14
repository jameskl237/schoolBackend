import { z } from "zod";

export const createSequenceSchema = z.object({
  periodId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  order: z.coerce.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateSequenceSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.coerce.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateSequenceInput = z.infer<typeof createSequenceSchema>;
export type UpdateSequenceInput = z.infer<typeof updateSequenceSchema>;
