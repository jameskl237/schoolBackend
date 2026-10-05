import { z } from "zod";

/** Le dossier médical est unique par élève : on l'enregistre par upsert. */
export const saveMedicalRecordSchema = z.object({
  bloodGroup: z.string().max(8).nullable().optional(),
  allergies: z.string().nullable().optional(),
  chronicConditions: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  doctorName: z.string().nullable().optional(),
  doctorPhone: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const createVaccinationSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  date: z.coerce.date(),
  nextDueDate: z.coerce.date().nullable().optional(),
});

export const updateVaccinationSchema = z.object({
  name: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  nextDueDate: z.coerce.date().nullable().optional(),
});

export const createVisitSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  date: z.coerce.date().optional(),
  reason: z.string().min(1),
  treatment: z.string().nullable().optional(),
  temperature: z.coerce.number().min(30).max(45).nullable().optional(),
  notifiedParent: z.boolean().optional(),
});

export const updateVisitSchema = z.object({
  reason: z.string().min(1).optional(),
  treatment: z.string().nullable().optional(),
  temperature: z.coerce.number().min(30).max(45).nullable().optional(),
  notifiedParent: z.boolean().optional(),
});

export type SaveMedicalRecordInput = z.infer<typeof saveMedicalRecordSchema>;
export type CreateVaccinationInput = z.infer<typeof createVaccinationSchema>;
export type UpdateVaccinationInput = z.infer<typeof updateVaccinationSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
