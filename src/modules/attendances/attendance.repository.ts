import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const attendanceInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  class: { select: { id: true, name: true, code: true } },
  recordedBy: { select: { id: true, firstName: true, lastName: true } },
  timetable: {
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      classSubject: { select: { id: true, subject: { select: { id: true, name: true } } } },
    },
  },
} satisfies Prisma.AttendanceInclude;

export interface AttendanceFilters {
  classId?: number;
  studentId?: number;
  from?: Date;
  to?: Date;
  /** Restreint aux classes où cet enseignant intervient. */
  teacherId?: number;
  /** Les enfants d'un parent donné. */
  parentId?: number;
}

export class AttendanceRepository {
  findMany(establishmentId: number, filters: AttendanceFilters = {}) {
    return prisma.attendance.findMany({
      where: {
        student: { establishmentId },
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.parentId
          ? { student: { studentParents: { some: { parentId: filters.parentId } } } }
          : {}),
        ...(filters.teacherId
          ? { class: { classSubjects: { some: { teacherId: filters.teacherId } } } }
          : {}),
        ...(filters.from || filters.to
          ? {
              date: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      include: attendanceInclude,
      orderBy: [{ date: "desc" }, { studentId: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.attendance.findFirst({
      where: { id, student: { establishmentId } },
      include: attendanceInclude,
    });
  }

  update(id: number, data: Prisma.AttendanceUpdateInput) {
    return prisma.attendance.update({ where: { id }, data, include: attendanceInclude });
  }

  delete(id: number) {
    return prisma.attendance.delete({ where: { id } });
  }

  /**
   * Réécrit l'appel d'une classe pour une date (et un créneau) donnés.
   * Le modèle n'a pas de contrainte d'unicité là-dessus : on remplace, plutôt
   * que d'empiler des appels successifs pour le même cours.
   */
  replaceSheet(
    scope: { classId: number; date: Date; timetableId: number | null },
    entries: Prisma.AttendanceUncheckedCreateInput[],
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({
        where: {
          classId: scope.classId,
          date: scope.date,
          timetableId: scope.timetableId,
        },
      });

      await tx.attendance.createMany({ data: entries });

      return tx.attendance.findMany({
        where: { classId: scope.classId, date: scope.date, timetableId: scope.timetableId },
        include: attendanceInclude,
        orderBy: { studentId: "asc" },
      });
    });
  }
}
