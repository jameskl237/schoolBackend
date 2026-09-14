import { z } from "zod";

import { AttendanceStatus } from "../../generated/prisma/enums.js";

const attendanceEntrySchema = z.object({
  studentId: z.coerce.number().int().positive(),
  status: z.enum(AttendanceStatus),
  justification: z.string().optional(),
});

/** L'appel se fait classe entière, pour une date et éventuellement un créneau. */
export const saveAttendancesSchema = z.object({
  classId: z.coerce.number().int().positive(),
  date: z.coerce.date(),
  timetableId: z.coerce.number().int().positive().optional(),
  entries: z.array(attendanceEntrySchema).min(1),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(AttendanceStatus).optional(),
  justification: z.string().nullable().optional(),
});

export type SaveAttendancesInput = z.infer<typeof saveAttendancesSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
