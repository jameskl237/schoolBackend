import { z } from "zod";

import { SectionLanguage } from "../../generated/prisma/enums.js";

export const createSectionSchema = z.object({
  schoolLevelId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  language: z.enum(SectionLanguage),
});

export const updateSectionSchema = z.object({
  schoolLevelId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  language: z.enum(SectionLanguage).optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
