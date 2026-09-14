import { z } from "zod";

import { SchoolType } from "../../generated/prisma/enums.js";

export const updateEstablishmentSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(SchoolType).optional(),
});

export type UpdateEstablishmentInput = z.infer<typeof updateEstablishmentSchema>;
