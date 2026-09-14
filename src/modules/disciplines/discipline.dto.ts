import { z } from "zod";

import { SanctionType } from "../../generated/prisma/enums.js";

export const createDisciplineRecordSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  type: z.enum(SanctionType),
  reason: z.string().min(1),
  date: z.coerce.date(),
  durationDays: z.coerce.number().int().min(0).nullable().optional(),
  description: z.string().optional(),
});

export const updateDisciplineRecordSchema = z.object({
  type: z.enum(SanctionType).optional(),
  reason: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  durationDays: z.coerce.number().int().min(0).nullable().optional(),
  description: z.string().nullable().optional(),
});

export type CreateDisciplineRecordInput = z.infer<typeof createDisciplineRecordSchema>;
export type UpdateDisciplineRecordInput = z.infer<typeof updateDisciplineRecordSchema>;