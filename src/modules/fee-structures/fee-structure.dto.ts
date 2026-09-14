import { z } from "zod";

export const createFeeStructureSchema = z.object({
  feeTypeId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive(),
  classId: z.coerce.number().int().positive().optional(),
  amount: z.coerce.number().positive(),
  dueDate: z.coerce.date().optional(),
});

export const updateFeeStructureSchema = z.object({
  feeTypeId: z.coerce.number().int().positive().optional(),
  academicYearId: z.coerce.number().int().positive().optional(),
  classId: z.coerce.number().int().positive().nullable().optional(),
  amount: z.coerce.number().positive().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
