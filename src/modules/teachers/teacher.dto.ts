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
  /** Compte existant à rattacher. Sans lui, un compte est ouvert automatiquement. */
  userId: z.coerce.number().int().positive().optional(),
  /** Mot de passe initial du compte créé ; à défaut, un mot de passe par défaut est posé. */
  password: z.string().min(8).optional(),
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
