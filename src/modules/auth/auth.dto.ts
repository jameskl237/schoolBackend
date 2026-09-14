import { z } from "zod";

/** TYPE-VILLE-000, ex. SEC-YDE-014 (PRI = primaire, SEC = secondaire, MIX = les deux). */
const ESTABLISHMENT_CODE_REGEX = /^(PRI|SEC|MIX)-[A-Z]{3}-\d{3}$/;

export const establishmentCodeSchema = z
  .string()
  .regex(ESTABLISHMENT_CODE_REGEX, "Format attendu : TYPE-VILLE-000 (ex. SEC-YDE-014)");

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  establishmentCode: establishmentCodeSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  establishmentCode: establishmentCodeSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
