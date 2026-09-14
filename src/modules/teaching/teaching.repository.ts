import { prisma } from "../../infrastructure/database/prisma.js";

const classSubjectSelect = {
  id: true,
  coefficient: true,
  teacherId: true,
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, firstName: true, lastName: true } },
  class: {
    select: { id: true, name: true, code: true, gradeLevelId: true, mainTeacherId: true },
  },
  academicYear: { select: { id: true, name: true, isCurrent: true } },
};

export class TeachingRepository {
  /** Les affectations de l'enseignant pour une année, classe par classe. */
  findAssignments(teacherId: number, establishmentId: number, academicYearId: number) {
    return prisma.classSubject.findMany({
      where: {
        teacherId,
        academicYearId,
        class: { gradeLevel: { cycle: { section: { schoolLevel: { establishmentId } } } } },
      },
      select: classSubjectSelect,
      orderBy: [{ classId: "asc" }, { subjectId: "asc" }],
    });
  }

  /** Toutes les matières des classes dont il est professeur principal. */
  findClassSubjectsOfClasses(classIds: number[], academicYearId: number) {
    if (classIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.classSubject.findMany({
      where: { classId: { in: classIds }, academicYearId },
      select: classSubjectSelect,
      orderBy: [{ classId: "asc" }, { subjectId: "asc" }],
    });
  }

  findMainTeacherClasses(teacherId: number, establishmentId: number) {
    return prisma.class.findMany({
      where: {
        mainTeacherId: teacherId,
        gradeLevel: { cycle: { section: { schoolLevel: { establishmentId } } } },
      },
      select: { id: true, name: true, code: true, gradeLevelId: true, mainTeacherId: true },
    });
  }

  countStudentsByClass(classIds: number[], academicYearId: number) {
    if (classIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.enrollment.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds }, academicYearId },
      _count: { _all: true },
    });
  }
}
