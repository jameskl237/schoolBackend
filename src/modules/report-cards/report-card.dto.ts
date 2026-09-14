import { z } from "zod";

const reportCardLineSchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  average: z.coerce.number().min(0).nullable().optional(),
  coefficient: z.coerce.number().min(0).default(1),
  rank: z.coerce.number().int().min(1).nullable().optional(),
  teacherComment: z.string().nullable().optional(),
});

export const createReportCardSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  periodId: z.coerce.number().int().positive(),
  generalAverage: z.coerce.number().min(0).nullable().optional(),
  rank: z.coerce.number().int().min(1).nullable().optional(),
  conduct: z.string().nullable().optional(),
  appreciation: z.string().nullable().optional(),
  lines: z.array(reportCardLineSchema).optional(),
  // Publie le bulletin immédiatement à la création (rendu visible aux parents).
  published: z.boolean().optional(),
});

export const updateReportCardSchema = z.object({
  generalAverage: z.coerce.number().min(0).nullable().optional(),
  rank: z.coerce.number().int().min(1).nullable().optional(),
  conduct: z.string().nullable().optional(),
  appreciation: z.string().nullable().optional(),
  lines: z.array(reportCardLineSchema).optional(),
  // true publie, false dépublie.
  published: z.boolean().optional(),
});

export type ReportCardLineInput = z.infer<typeof reportCardLineSchema>;
export type CreateReportCardInput = z.infer<typeof createReportCardSchema>;
export type UpdateReportCardInput = z.infer<typeof updateReportCardSchema>;