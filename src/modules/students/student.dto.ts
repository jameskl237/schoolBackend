import { z } from "zod";

import { EnrollmentStatus, Gender, ParentRelationType } from "../../generated/prisma/enums.js";

/** Informations du parent créé avec l'élève par la scolarité. */
export const createParentWithStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  relationType: z.enum(ParentRelationType).default(ParentRelationType.OTHER),
  // Mot de passe initial du futur compte parent. Généré si absent.
  password: z.string().min(8).optional(),
});

export const createStudentSchema = z.object({
  studentNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.coerce.date(),
  placeOfBirth: z.string().optional(),
  gender: z.enum(Gender),
  nationality: z.string().optional(),
  address: z.string().optional(),
  // La classe est obligatoire : tout élève créé est rattaché à une classe,
  // d'abord avec le statut PENDING ("non inscrit") jusqu'à l'inscription par la scolarité.
  classId: z.coerce.number().int().positive(),
  // Par défaut l'année scolaire courante de l'établissement.
  academicYearId: z.coerce.number().int().positive().optional(),
  // Parent créé en même temps que l'élève. Sans parent :
  // l'élève est considéré comme son propre parent.
  parent: createParentWithStudentSchema.optional(),
});

export const updateStudentSchema = z.object({
  studentNumber: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.coerce.date().optional(),
  placeOfBirth: z.string().optional(),
  gender: z.enum(Gender).optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  // Réaffecte l'élève à une autre classe sur son inscription courante.
  classId: z.coerce.number().int().positive().optional(),
});

/** Mise à jour du statut d'inscription par la scolarité (secrétariat). */
export const updateStudentEnrollmentSchema = z.object({
  status: z.enum(EnrollmentStatus),
  classId: z.coerce.number().int().positive().optional(),
});

export type CreateParentWithStudentInput = z.infer<typeof createParentWithStudentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type UpdateStudentEnrollmentInput = z.infer<typeof updateStudentEnrollmentSchema>;
