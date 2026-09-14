import { z } from "zod";

export const createClassSubjectSchema = z.object({
  classId: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive(),
  teacherId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive(),
  coefficient: z.coerce.number().positive().optional(),
  hoursPerWeek: z.coerce.number().positive().optional(),
});

export const updateClassSubjectSchema = z.object({
  teacherId: z.coerce.number().int().positive().optional(),
  coefficient: z.coerce.number().positive().optional(),
  hoursPerWeek: z.coerce.number().positive().nullable().optional(),
});

export type CreateClassSubjectInput = z.infer<typeof createClassSubjectSchema>;
export type UpdateClassSubjectInput = z.infer<typeof updateClassSubjectSchema>;
