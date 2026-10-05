import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const recordInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  academicYear: { select: { id: true, name: true, isCurrent: true } },
  sessions: {
    orderBy: { date: "desc" },
    include: { counselor: { select: { id: true, firstName: true, lastName: true } } },
  },
} satisfies Prisma.OrientationRecordInclude;

export interface OrientationFilters {
  studentId?: number;
  academicYearId?: number;
  status?: string;
}

export class OrientationRepository {
  findMany(establishmentId: number, filters: OrientationFilters = {}) {
    return prisma.orientationRecord.findMany({
      where: {
        student: { establishmentId },
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters.status ? { status: filters.status as never } : {}),
      },
      include: recordInclude,
      orderBy: [{ academicYearId: "desc" }, { student: { lastName: "asc" } }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.orientationRecord.findFirst({
      where: { id, student: { establishmentId } },
      include: recordInclude,
    });
  }

  create(data: Prisma.OrientationRecordUncheckedCreateInput) {
    return prisma.orientationRecord.create({ data, include: recordInclude });
  }

  update(id: number, data: Prisma.OrientationRecordUpdateInput) {
    return prisma.orientationRecord.update({ where: { id }, data, include: recordInclude });
  }

  delete(id: number) {
    return prisma.orientationRecord.delete({ where: { id } });
  }

  findSession(id: number, establishmentId: number) {
    return prisma.counselingSession.findFirst({
      where: { id, orientationRecord: { student: { establishmentId } } },
    });
  }

  createSession(data: Prisma.CounselingSessionUncheckedCreateInput) {
    return prisma.counselingSession.create({ data });
  }

  updateSession(id: number, data: Prisma.CounselingSessionUpdateInput) {
    return prisma.counselingSession.update({ where: { id }, data });
  }

  deleteSession(id: number) {
    return prisma.counselingSession.delete({ where: { id } });
  }
}
