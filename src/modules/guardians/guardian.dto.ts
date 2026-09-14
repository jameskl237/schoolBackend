import { z } from "zod";

import { GuardianRelationType } from "../../generated/prisma/enums.js";

const studentLinkSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  relationType: z.enum(GuardianRelationType),
  isFinanciallyResponsible: z.boolean().optional(),
  canPickup: z.boolean().optional(),
});

export const createGuardianSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  students: z.array(studentLinkSchema).optional(),
});

export const updateGuardianSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  students: z.array(studentLinkSchema).optional(),
});

export type StudentLinkInput = z.infer<typeof studentLinkSchema>;
export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
