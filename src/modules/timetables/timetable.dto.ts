import { z } from "zod";

import { DayOfWeek } from "../../generated/prisma/enums.js";

/** Les créneaux sont saisis en "HH:MM" et stockés dans une colonne TIME. */
const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM")
  .transform((value) => {
    const [hours, minutes] = value.split(":").map(Number);

    return new Date(Date.UTC(1970, 0, 1, hours as number, minutes as number));
  });

export const createTimetableSchema = z.object({
  classSubjectId: z.coerce.number().int().positive(),
  classroomId: z.coerce.number().int().positive(),
  dayOfWeek: z.enum(DayOfWeek),
  startTime: timeOfDay,
  endTime: timeOfDay,
});

export const updateTimetableSchema = z.object({
  classroomId: z.coerce.number().int().positive().optional(),
  dayOfWeek: z.enum(DayOfWeek).optional(),
  startTime: timeOfDay.optional(),
  endTime: timeOfDay.optional(),
});

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>;
