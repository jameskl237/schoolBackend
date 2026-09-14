import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const evaluationInclude = {
  classSubject: {
    select: {
      id: true,
      teacherId: true,
      coefficient: true,
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true, code: true, mainTeacherId: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      academicYear: { select: { id: true, name: true } },
    },
  },
  reviews: {
    take: 1,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  },
  period: { select: { id: true, name: true, order: true } },
  sequence: { select: { id: true, name: true, order: true } },
  validatedBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { grades: true } },
} satisfies Prisma.EvaluationInclude;

export type EvaluationWithContext = Prisma.EvaluationGetPayload<{
  include: typeof evaluationInclude;
}>;

export interface EvaluationFilters {
  classSubjectId?: number;
  periodId?: number;
  sequenceId?: number;
  classId?: number;
  academicYearId?: number;
  /**
   * Périmètre d'un enseignant : ses propres matières, plus toutes celles des
   * classes dont il est professeur principal.
   */
  teacherScope?: { teacherId: number; mainClassIds: number[] };
}

const teacherScopeWhere = (
  scope: EvaluationFilters["teacherScope"],
): Prisma.EvaluationWhereInput => {
  if (!scope) {
    return {};
  }

  return {
    OR: [
      { classSubject: { teacherId: scope.teacherId } },
      ...(scope.mainClassIds.length > 0
        ? [{ classSubject: { classId: { in: scope.mainClassIds } } }]
        : []),
    ],
  };
};

const inEstablishment = (establishmentId: number): Prisma.EvaluationWhereInput => ({
  classSubject: {
    class: { gradeLevel: { cycle: { section: { schoolLevel: { establishmentId } } } } },
  },
});

export class EvaluationRepository {
  findMany(establishmentId: number, filters: EvaluationFilters = {}) {
    return prisma.evaluation.findMany({
      where: {
        ...inEstablishment(establishmentId),
        ...(filters.classSubjectId ? { classSubjectId: filters.classSubjectId } : {}),
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.sequenceId ? { sequenceId: filters.sequenceId } : {}),
        ...(filters.classId || filters.academicYearId
          ? {
              classSubject: {
                ...(filters.classId ? { classId: filters.classId } : {}),
                ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
                class: { gradeLevel: { cycle: { section: { schoolLevel: { establishmentId } } } } },
              },
            }
          : {}),
        ...teacherScopeWhere(filters.teacherScope),
      },
      include: evaluationInclude,
      orderBy: { date: "desc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.evaluation.findFirst({
      where: { id, ...inEstablishment(establishmentId) },
      include: evaluationInclude,
    });
  }

  create(data: Prisma.EvaluationCreateInput) {
    return prisma.evaluation.create({ data, include: evaluationInclude });
  }

  update(id: number, data: Prisma.EvaluationUpdateInput) {
    return prisma.evaluation.update({ where: { id }, data, include: evaluationInclude });
  }

  delete(id: number) {
    return prisma.evaluation.delete({ where: { id } });
  }
}
