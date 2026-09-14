import { z } from "zod";

import { Gender } from "../../generated/prisma/enums.js";

export const createTeacherSchema = z.object({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(Gender),
  phone: z.string().optional(),
  email: z.email().optional(),
  hireDate: z.coerce.date().optional(),
  specialty: z.string().optional(),
  /** Compte utilisateur à rattacher, pour que l'enseignant accède à ses classes. */
  userId: z.coerce.number().int().positive().optional(),
});

export const updateTeacherSchema = z.object({
  employeeNumber: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  gender: z.enum(Gender).optional(),
  phone: z.string().nullable().optional(),
  email: z.email().nullable().optional(),
  hireDate: z.coerce.date().nullable().optional(),
  specialty: z.string().nullable().optional(),
  userId: z.coerce.number().int().positive().nullable().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
