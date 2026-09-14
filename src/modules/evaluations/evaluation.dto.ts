import { z } from "zod";

import { EvaluationType } from "../../generated/prisma/enums.js";

export const createEvaluationSchema = z.object({
  classSubjectId: z.coerce.number().int().positive(),
  periodId: z.coerce.number().int().positive(),
  // Toute nouvelle évaluation est séquentielle : elle se rattache à une séquence
  // du trimestre visé.
  sequenceId: z.coerce.number().int().positive(),
  title: z.string().min(1),
  type: z.enum(EvaluationType),
  date: z.coerce.date(),
  maxScore: z.coerce.number().positive().optional(),
  coefficient: z.coerce.number().positive().optional(),
});

export const updateEvaluationSchema = z.object({
  periodId: z.coerce.number().int().positive().optional(),
  sequenceId: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  type: z.enum(EvaluationType).optional(),
  date: z.coerce.date().optional(),
  maxScore: z.coerce.number().positive().optional(),
  coefficient: z.coerce.number().positive().optional(),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;
