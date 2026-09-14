import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const gradeInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  evaluation: {
    select: {
      id: true,
      title: true,
      type: true,
      date: true,
      maxScore: true,
      coefficient: true,
      validatedAt: true,
      classSubject: {
        select: {
          id: true,
          teacherId: true,
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, code: true, mainTeacherId: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      period: { select: { id: true, name: true, order: true } },
      sequence: { select: { id: true, name: true, order: true } },
    },
  },
} satisfies Prisma.GradeInclude;

export interface GradeFilters {
  evaluationId?: number;
  studentId?: number;
  periodId?: number;
  sequenceId?: number;
  classId?: number;
  academicYearId?: number;
  /** Les enfants d'un parent donné (une seule fois, sans doublon dans la requête). */
  parentId?: number;
  /** Ses matières, plus toutes celles des classes dont il est professeur principal. */
  teacherScope?: { teacherId: number; mainClassIds: number[] };
}

const teacherScopeWhere = (scope: GradeFilters["teacherScope"]): Prisma.GradeWhereInput => {
  if (!scope) {
    return {};
  }

  return {
    OR: [
      { evaluation: { classSubject: { teacherId: scope.teacherId } } },
      ...(scope.mainClassIds.length > 0
        ? [{ evaluation: { classSubject: { classId: { in: scope.mainClassIds } } } }]
        : []),
    ],
  };
};

const inEstablishment = (establishmentId: number): Prisma.GradeWhereInput => ({
  student: { establishmentId },
});

export class GradeRepository {
  findMany(establishmentId: number, filters: GradeFilters = {}) {
    return prisma.grade.findMany({
      where: {
        ...inEstablishment(establishmentId),
        ...(filters.evaluationId ? { evaluationId: filters.evaluationId } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.parentId
          ? { student: { studentParents: { some: { parentId: filters.parentId } } } }
          : {}),
        ...(filters.periodId || filters.sequenceId || filters.classId || filters.academicYearId
          ? {
              evaluation: {
                ...(filters.periodId ? { periodId: filters.periodId } : {}),
                ...(filters.sequenceId ? { sequenceId: filters.sequenceId } : {}),
                ...(filters.classId || filters.academicYearId
                  ? {
                      classSubject: {
                        ...(filters.classId ? { classId: filters.classId } : {}),
                        ...(filters.academicYearId
                          ? { academicYearId: filters.academicYearId }
                          : {}),
                      },
                    }
                  : {}),
              },
            }
          : {}),
        ...teacherScopeWhere(filters.teacherScope),
      },
      include: gradeInclude,
      orderBy: [{ evaluationId: "desc" }, { studentId: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.grade.findFirst({
      where: { id, ...inEstablishment(establishmentId) },
      include: gradeInclude,
    });
  }

  update(id: number, data: Prisma.GradeUpdateInput) {
    return prisma.grade.update({ where: { id }, data, include: gradeInclude });
  }

  delete(id: number) {
    return prisma.grade.delete({ where: { id } });
  }

  /** Écrit toute la feuille de notes d'une évaluation en une transaction. */
  saveMany(evaluationId: number, entries: { studentId: number; data: Prisma.GradeUncheckedCreateInput }[]) {
    return prisma.$transaction(
      entries.map((entry) =>
        prisma.grade.upsert({
          where: { evaluationId_studentId: { evaluationId, studentId: entry.studentId } },
          update: {
            score: entry.data.score ?? null,
            isAbsent: entry.data.isAbsent ?? false,
            comment: entry.data.comment ?? null,
          },
          create: entry.data,
          include: gradeInclude,
        }),
      ),
    );
  }
}
