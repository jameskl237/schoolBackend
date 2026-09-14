import type { DayOfWeek, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const timetableInclude = {
  classroom: { select: { id: true, name: true, code: true } },
  classSubject: {
    select: {
      id: true,
      teacherId: true,
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      academicYear: { select: { id: true, name: true, isCurrent: true } },
    },
  },
} satisfies Prisma.TimetableInclude;

export interface TimetableFilters {
  classId?: number;
  teacherId?: number;
  classroomId?: number;
  academicYearId?: number;
}

const inEstablishment = (establishmentId: number): Prisma.TimetableWhereInput => ({
  classroom: { establishmentId },
});

export class TimetableRepository {
  findMany(establishmentId: number, filters: TimetableFilters = {}) {
    return prisma.timetable.findMany({
      where: {
        ...inEstablishment(establishmentId),
        ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
        ...(filters.classId || filters.teacherId || filters.academicYearId
          ? {
              classSubject: {
                ...(filters.classId ? { classId: filters.classId } : {}),
                ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
                ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
              },
            }
          : {}),
      },
      include: timetableInclude,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.timetable.findFirst({
      where: { id, ...inEstablishment(establishmentId) },
      include: timetableInclude,
    });
  }

  /**
   * Créneaux du même jour qui chevauchent [startTime, endTime[ pour la même
   * salle ou le même enseignant : deux cours ne peuvent pas s'y superposer.
   */
  findConflicts(params: {
    dayOfWeek: DayOfWeek;
    startTime: Date;
    endTime: Date;
    classroomId: number;
    teacherId: number;
    classId: number;
    excludeId?: number;
  }) {
    return prisma.timetable.findMany({
      where: {
        dayOfWeek: params.dayOfWeek,
        startTime: { lt: params.endTime },
        endTime: { gt: params.startTime },
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
        OR: [
          { classroomId: params.classroomId },
          { classSubject: { teacherId: params.teacherId } },
          { classSubject: { classId: params.classId } },
        ],
      },
      include: timetableInclude,
    });
  }

  create(data: Prisma.TimetableCreateInput) {
    return prisma.timetable.create({ data, include: timetableInclude });
  }

  update(id: number, data: Prisma.TimetableUpdateInput) {
    return prisma.timetable.update({ where: { id }, data, include: timetableInclude });
  }

  delete(id: number) {
    return prisma.timetable.delete({ where: { id } });
  }
}
