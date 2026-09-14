import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const classSubjectInclude = {
  class: { select: { id: true, name: true, code: true, gradeLevelId: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
  academicYear: { select: { id: true, name: true, isCurrent: true } },
} satisfies Prisma.ClassSubjectInclude;

export interface ClassSubjectFilters {
  classId?: number;
  teacherId?: number;
  academicYearId?: number;
}

/** Toutes les lectures restent bornées à l'établissement via la chaîne classe → niveau. */
const inEstablishment = (establishmentId: number): Prisma.ClassSubjectWhereInput => ({
  class: { gradeLevel: { cycle: { section: { schoolLevel: { establishmentId } } } } },
});

export class ClassSubjectRepository {
  findMany(establishmentId: number, filters: ClassSubjectFilters = {}) {
    return prisma.classSubject.findMany({
      where: {
        ...inEstablishment(establishmentId),
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: classSubjectInclude,
      orderBy: [{ classId: "asc" }, { subjectId: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.classSubject.findFirst({
      where: { id, ...inEstablishment(establishmentId) },
      include: classSubjectInclude,
    });
  }

  create(data: Prisma.ClassSubjectCreateInput) {
    return prisma.classSubject.create({ data, include: classSubjectInclude });
  }

  update(id: number, data: Prisma.ClassSubjectUpdateInput) {
    return prisma.classSubject.update({ where: { id }, data, include: classSubjectInclude });
  }

  delete(id: number) {
    return prisma.classSubject.delete({ where: { id } });
  }
}
