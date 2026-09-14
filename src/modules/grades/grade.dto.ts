import { z } from "zod";

const gradeEntrySchema = z.object({
  studentId: z.coerce.number().int().positive(),
  score: z.coerce.number().min(0).nullable().optional(),
  isAbsent: z.boolean().optional(),
  comment: z.string().optional(),
});

/** La saisie se fait classe entière : une évaluation, la liste de ses notes. */
export const saveGradesSchema = z.object({
  evaluationId: z.coerce.number().int().positive(),
  grades: z.array(gradeEntrySchema).min(1),
});

export const updateGradeSchema = z.object({
  score: z.coerce.number().min(0).nullable().optional(),
  isAbsent: z.boolean().optional(),
  comment: z.string().nullable().optional(),
});

export type GradeEntryInput = z.infer<typeof gradeEntrySchema>;
export type SaveGradesInput = z.infer<typeof saveGradesSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
