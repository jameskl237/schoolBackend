import { z } from "zod";

import { EnrollmentStatus } from "../../generated/prisma/enums.js";

export const createEnrollmentSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  classId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive(),
  status: z.enum(EnrollmentStatus).optional(),
  enrollmentDate: z.coerce.date().optional(),
});

export const updateEnrollmentSchema = z.object({
  classId: z.coerce.number().int().positive().optional(),
  academicYearId: z.coerce.number().int().positive().optional(),
  status: z.enum(EnrollmentStatus).optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
