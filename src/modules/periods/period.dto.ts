import { z } from "zod";

export const createPeriodSchema = z.object({
  academicYearId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  order: z.coerce.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updatePeriodSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.coerce.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;
