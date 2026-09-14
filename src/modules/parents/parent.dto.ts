import { z } from "zod";

import { ParentRelationType } from "../../generated/prisma/enums.js";

const studentLinkSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  relationType: z.enum(ParentRelationType),
  isPrimaryContact: z.boolean().optional(),
});

export const createParentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  students: z.array(studentLinkSchema).optional(),
});

export const updateParentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  students: z.array(studentLinkSchema).optional(),
});

export type StudentLinkInput = z.infer<typeof studentLinkSchema>;
export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
