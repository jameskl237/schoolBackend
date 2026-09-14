import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const enrollmentInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  class: { select: { id: true, name: true, code: true } },
  academicYear: { select: { id: true, name: true } },
} satisfies Prisma.EnrollmentInclude;

export interface EnrollmentFilters {
  classId?: number;
  academicYearId?: number;
}

export class EnrollmentRepository {
  findMany(establishmentId: number, filters: EnrollmentFilters = {}) {
    return prisma.enrollment.findMany({
      where: {
        student: { establishmentId },
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: enrollmentInclude,
      orderBy: { enrollmentDate: "desc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.enrollment.findFirst({
      where: { id, student: { establishmentId } },
      include: enrollmentInclude,
    });
  }

  /** L'inscription la plus récente d'un élève (année scolaire la plus proche). */
  findLatestByStudent(studentId: number) {
    return prisma.enrollment.findFirst({
      where: { studentId },
      include: enrollmentInclude,
      orderBy: { academicYear: { startDate: "desc" } },
    });
  }

  create(data: Prisma.EnrollmentCreateInput) {
    return prisma.enrollment.create({ data, include: enrollmentInclude });
  }

  update(id: number, data: Prisma.EnrollmentUpdateInput) {
    return prisma.enrollment.update({ where: { id }, data, include: enrollmentInclude });
  }

  delete(id: number) {
    return prisma.enrollment.delete({ where: { id } });
  }
}
