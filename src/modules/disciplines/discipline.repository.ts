import type { Prisma } from "../../generated/prisma/client.js";
import type { SanctionType } from "../../generated/prisma/enums.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const disciplineInclude = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentNumber: true,
      enrollments: {
        take: 1,
        orderBy: { academicYear: { startDate: "desc" } },
        select: { class: { select: { id: true, name: true, code: true } } },
      },
    },
  },
  issuedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.DisciplineRecordInclude;

export interface DisciplineFilters {
  studentId?: number;
  classId?: number;
  type?: SanctionType;
  from?: Date;
  to?: Date;
  /** Les enfants d'un parent donné. */
  parentId?: number;
}

export class DisciplineRepository {
  findMany(establishmentId: number, filters: DisciplineFilters = {}) {
    return prisma.disciplineRecord.findMany({
      where: {
        student: { establishmentId },
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.classId
          ? { student: { enrollments: { some: { classId: filters.classId } } } }
          : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.parentId
          ? { student: { studentParents: { some: { parentId: filters.parentId } } } }
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
      include: disciplineInclude,
      orderBy: [{ date: "desc" }, { studentId: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.disciplineRecord.findFirst({
      where: { id, student: { establishmentId } },
      include: disciplineInclude,
    });
  }

  create(data: Prisma.DisciplineRecordCreateInput) {
    return prisma.disciplineRecord.create({ data, include: disciplineInclude });
  }

  update(id: number, data: Prisma.DisciplineRecordUpdateInput) {
    return prisma.disciplineRecord.update({ where: { id }, data, include: disciplineInclude });
  }

  delete(id: number) {
    return prisma.disciplineRecord.delete({ where: { id } });
  }
}