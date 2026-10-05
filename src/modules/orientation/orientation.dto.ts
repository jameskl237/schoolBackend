import { z } from "zod";

import { OrientationStatus } from "../../generated/prisma/enums.js";

export const createOrientationSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive().optional(),
  recommendedTrack: z.string().nullable().optional(),
  finalDecision: z.string().nullable().optional(),
  status: z.enum(OrientationStatus).optional(),
});

export const updateOrientationSchema = z.object({
  recommendedTrack: z.string().nullable().optional(),
  finalDecision: z.string().nullable().optional(),
  status: z.enum(OrientationStatus).optional(),
});

export const createSessionSchema = z.object({
  orientationRecordId: z.coerce.number().int().positive(),
  date: z.coerce.date().optional(),
  notes: z.string().nullable().optional(),
  followUpDate: z.coerce.date().nullable().optional(),
});

export const updateSessionSchema = z.object({
  date: z.coerce.date().optional(),
  notes: z.string().nullable().optional(),
  followUpDate: z.coerce.date().nullable().optional(),
});

export type CreateOrientationInput = z.infer<typeof createOrientationSchema>;
export type UpdateOrientationInput = z.infer<typeof updateOrientationSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
