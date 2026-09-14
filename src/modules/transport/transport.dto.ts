import { z } from "zod";

import { TransportSubscriptionStatus } from "../../generated/prisma/enums.js";

export const createRouteSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  fee: z.coerce.number().nonnegative(),
  feeTypeId: z.coerce.number().int().positive().optional(),
});

export const updateRouteSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  fee: z.coerce.number().nonnegative().optional(),
  feeTypeId: z.coerce.number().int().positive().nullable().optional(),
});

export const createSubscriptionSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  routeId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive().optional(),
  status: z.enum(TransportSubscriptionStatus).optional(),
  startDate: z.coerce.date().optional(),
  pickupPoint: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  routeId: z.coerce.number().int().positive().optional(),
  status: z.enum(TransportSubscriptionStatus).optional(),
  endDate: z.coerce.date().nullable().optional(),
  pickupPoint: z.string().nullable().optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
