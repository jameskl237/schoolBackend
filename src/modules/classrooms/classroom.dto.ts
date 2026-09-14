import { z } from "zod";

export const createClassroomSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  capacity: z.coerce.number().int().positive().optional(),
});

export const updateClassroomSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  capacity: z.coerce.number().int().positive().nullable().optional(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
