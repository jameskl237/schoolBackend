import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const reportCardInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  period: { select: { id: true, name: true, order: true, academicYear: { select: { id: true, name: true } } } },
  class: { select: { id: true, name: true, code: true } },
  lines: {
    orderBy: { subject: { name: "asc" } },
    include: { subject: { select: { id: true, name: true, code: true } } },
  },
} satisfies Prisma.ReportCardInclude;

export interface ReportCardFilters {
  studentId?: number;
  periodId?: number;
  classId?: number;
  /** Les enfants d'un parent donné. */
  parentId?: number;
  /** Ne renvoie que les bulletins publiés (vision parent/élève). */
  onlyPublished?: boolean;
}

export class ReportCardRepository {
  findMany(establishmentId: number, filters: ReportCardFilters = {}) {
    return prisma.reportCard.findMany({
      where: {
        student: { establishmentId },
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.parentId
          ? { student: { studentParents: { some: { parentId: filters.parentId } } } }
          : {}),
        ...(filters.onlyPublished ? { publishedAt: { not: null } } : {}),
      },
      include: reportCardInclude,
      orderBy: [{ period: { order: "desc" } }, { studentId: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.reportCard.findFirst({
      where: { id, student: { establishmentId } },
      include: reportCardInclude,
    });
  }

  create(data: Prisma.ReportCardCreateInput) {
    return prisma.reportCard.create({ data, include: reportCardInclude });
  }

  update(id: number, data: Prisma.ReportCardUpdateInput) {
    return prisma.reportCard.update({ where: { id }, data, include: reportCardInclude });
  }

  delete(id: number) {
    return prisma.reportCard.delete({ where: { id } });
  }

  /** Remplace les lignes matière d'un bulletin par exactement le jeu fourni. */
  replaceLines(reportCardId: number, lines: ReportCardLineSeed[]) {
    return prisma.$transaction(async (tx) => {
      await tx.reportCardLine.deleteMany({ where: { reportCardId } });

      if (lines.length > 0) {
        await tx.reportCardLine.createMany({
          data: lines.map((line) => ({
            reportCardId,
            subjectId: line.subjectId,
            average: line.average ?? null,
            coefficient: line.coefficient ?? 1,
            rank: line.rank ?? null,
            teacherComment: line.teacherComment ?? null,
          })),
        });
      }
    });
  }
}

interface ReportCardLineSeed {
  subjectId: number;
  average?: number | null | undefined;
  coefficient?: number | undefined;
  rank?: number | null | undefined;
  teacherComment?: string | null | undefined;
}