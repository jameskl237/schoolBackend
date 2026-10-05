import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

/** L'inscription la plus récente porte la classe et le statut affichés sur la fiche élève. */
export const studentInclude = {
  enrollments: {
    take: 1,
    orderBy: { academicYear: { startDate: "desc" } },
    include: {
      class: { select: { id: true, name: true, code: true, gradeLevelId: true } },
      academicYear: { select: { id: true, name: true } },
    },
  },
  studentParents: {
    select: {
      relationType: true,
      isPrimaryContact: true,
      parent: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true, userId: true },
      },
    },
  },
} satisfies Prisma.StudentInclude;

export type StudentWithEnrollment = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

export interface StudentFilters {
  classId?: number;
  academicYearId?: number;
}

/** Restreint aux élèves inscrits dans cette classe (et cette année si précisée). */
const enrolledIn = (filters: StudentFilters): Prisma.StudentWhereInput =>
  filters.classId === undefined && filters.academicYearId === undefined
    ? {}
    : {
        enrollments: {
          some: {
            ...(filters.classId !== undefined ? { classId: filters.classId } : {}),
            ...(filters.academicYearId !== undefined
              ? { academicYearId: filters.academicYearId }
              : {}),
          },
        },
      };

export class StudentRepository {
  /** `scope` restreint la lecture au périmètre de l'appelant (cf. studentScopeFilter). */
  findMany(
    establishmentId: number,
    scope: Prisma.StudentWhereInput = {},
    filters: StudentFilters = {},
  ) {
    return prisma.student.findMany({
      where: { establishmentId, ...scope, ...enrolledIn(filters) },
      include: studentInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  findById(id: number, establishmentId: number, scope: Prisma.StudentWhereInput = {}) {
    return prisma.student.findFirst({
      where: { id, establishmentId, ...scope },
      include: studentInclude,
    });
  }

  /** Crée l'élève et son inscription initiale dans la même transaction. */
  create(data: Prisma.StudentCreateInput) {
    return prisma.student.create({ data, include: studentInclude });
  }

  /** Les comptes (users) des parents liés à l'élève qui ont ouvert une session. */
  async findParentUserIds(studentId: number): Promise<number[]> {
    const links = await prisma.studentParent.findMany({
      where: { studentId, parent: { userId: { not: null } } },
      select: { parent: { select: { userId: true } } },
    });

    return links
      .map((link) => link.parent.userId)
      .filter((userId): userId is number => userId !== null);
  }

  /** L'élève est-il inscrit dans la classe ? (lecture d'accès, ex. épreuve d'évaluation) */
  async isEnrolledInClass(studentId: number, classId: number): Promise<boolean> {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, classId },
      select: { id: true },
    });

    return enrollment !== null;
  }

  /** Le parent a-t-il un enfant inscrit dans la classe ? (lecture d'accès) */
  async hasChildInClass(parentId: number, classId: number): Promise<boolean> {
    const link = await prisma.studentParent.findFirst({
      where: {
        parentId,
        student: { enrollments: { some: { classId } } },
      },
      select: { id: true },
    });

    return link !== null;
  }

  update(id: number, data: Prisma.StudentUpdateInput) {
    return prisma.student.update({ where: { id }, data, include: studentInclude });
  }

  delete(id: number) {
    return prisma.student.delete({ where: { id } });
  }
}
