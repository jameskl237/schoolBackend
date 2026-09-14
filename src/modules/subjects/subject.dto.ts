import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
