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
  /**
   * Facultatif : l'adresse suffit à identifier le compte dans la quasi-totalité
   * des cas. Le code n'est réclamé que si la même adresse existe dans plusieurs
   * établissements — un parent n'a donc rien à connaître de plus que ses identifiants.
   *
   * Un champ laissé vide par le client vaut « non fourni » : sans cela, un
   * formulaire qui envoie une chaîne vide échouerait sur le format attendu.
   */
  establishmentCode: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    establishmentCodeSchema.optional(),
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
