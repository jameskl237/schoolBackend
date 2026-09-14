import { z } from "zod";

import { SchoolLevelType } from "../../generated/prisma/enums.js";

export const createSchoolLevelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(SchoolLevelType),
});

export const updateSchoolLevelSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(SchoolLevelType).optional(),
});

export type CreateSchoolLevelInput = z.infer<typeof createSchoolLevelSchema>;
export type UpdateSchoolLevelInput = z.infer<typeof updateSchoolLevelSchema>;
