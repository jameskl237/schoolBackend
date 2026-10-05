import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .regex(/^[A-Z][A-Z_]*$/, "Le nom doit être en majuscules, ex. SURVEILLANT_GENERAL"),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string().min(1)).optional(),
});

export const updateRoleSchema = z.object({
  description: z.string().nullable().optional(),
});

/** Remplace d'un bloc les permissions du rôle par exactement celles fournies. */
export const setPermissionsSchema = z.object({
  permissions: z.array(z.string().min(1)),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SetPermissionsInput = z.infer<typeof setPermissionsSchema>;
