import { z } from "zod";

export const createClassSchema = z.object({
  gradeLevelId: z.coerce.number().int().positive(),
  classroomId: z.coerce.number().int().positive().optional(),
  // Professeur principal de la classe, seul habilité à viser les notes de toutes ses matières.
  mainTeacherId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
});

export const updateClassSchema = z.object({
  gradeLevelId: z.coerce.number().int().positive().optional(),
  classroomId: z.coerce.number().int().positive().nullable().optional(),
  mainTeacherId: z.coerce.number().int().positive().nullable().optional(),
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
