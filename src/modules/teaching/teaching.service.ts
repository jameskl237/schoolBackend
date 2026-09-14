import { AppError } from "../../common/errors/app-error.js";
import type { AccessScope } from "../../common/utils/access-scope.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";

import { TeachingRepository } from "./teaching.repository.js";

interface SubjectEntry {
  classSubjectId: number;
  subjectId: number;
  name: string;
  code: string;
  coefficient: number;
  teacher: { id: number; firstName: string; lastName: string };
}

interface MyClass {
  id: number;
  name: string;
  code: string;
  gradeLevelId: number;
  isMainTeacher: boolean;
  studentCount: number;
  /** Les matières que j'enseigne dans cette classe. */
  mySubjects: SubjectEntry[];
  /** Toutes les matières de la classe — renseigné uniquement pour le professeur principal. */
  allSubjects: SubjectEntry[];
}

export class TeachingService {
  constructor(
    private readonly teachingRepository = new TeachingRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
  ) {}

  /**
   * Le tableau de bord de l'enseignant : les classes qu'il tient cette année,
   * ses matières dans chacune, et — s'il en est professeur principal — la liste
   * complète des matières de la classe.
   */
  async myClasses(scope: AccessScope, academicYearId?: number) {
    if (scope.teacherId === undefined) {
      return { academicYear: null, classes: [] as MyClass[] };
    }

    const academicYear = await this.resolveAcademicYear(scope.establishmentId, academicYearId);

    const [assignments, mainClasses] = await Promise.all([
      this.teachingRepository.findAssignments(
        scope.teacherId,
        scope.establishmentId,
        academicYear.id,
      ),
      this.teachingRepository.findMainTeacherClasses(scope.teacherId, scope.establishmentId),
    ]);

    const classes = new Map<number, MyClass>();

    const register = (entry: (typeof assignments)[number], isMainTeacher: boolean) => {
      const existing = classes.get(entry.class.id);

      if (existing) {
        return existing;
      }

      const created: MyClass = {
        id: entry.class.id,
        name: entry.class.name,
        code: entry.class.code,
        gradeLevelId: entry.class.gradeLevelId,
        isMainTeacher,
        studentCount: 0,
        mySubjects: [],
        allSubjects: [],
      };

      classes.set(entry.class.id, created);

      return created;
    };

    const mainClassIds = new Set(mainClasses.map((entry) => entry.id));

    for (const assignment of assignments) {
      const entry = register(assignment, mainClassIds.has(assignment.class.id));

      entry.mySubjects.push(toSubjectEntry(assignment));
    }

    // Le professeur principal voit sa classe même s'il n'y enseigne aucune matière.
    for (const mainClass of mainClasses) {
      if (!classes.has(mainClass.id)) {
        classes.set(mainClass.id, {
          id: mainClass.id,
          name: mainClass.name,
          code: mainClass.code,
          gradeLevelId: mainClass.gradeLevelId,
          isMainTeacher: true,
          studentCount: 0,
          mySubjects: [],
          allSubjects: [],
        });
      }
    }

    const everySubject = await this.teachingRepository.findClassSubjectsOfClasses(
      [...mainClassIds],
      academicYear.id,
    );

    for (const assignment of everySubject) {
      classes.get(assignment.class.id)?.allSubjects.push(toSubjectEntry(assignment));
    }

    const counts = await this.teachingRepository.countStudentsByClass(
      [...classes.keys()],
      academicYear.id,
    );

    for (const count of counts) {
      const entry = classes.get(count.classId);

      if (entry) {
        entry.studentCount = count._count._all;
      }
    }

    return {
      academicYear: {
        id: academicYear.id,
        name: academicYear.name,
        isCurrent: academicYear.isCurrent,
      },
      classes: [...classes.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  private async resolveAcademicYear(establishmentId: number, academicYearId?: number) {
    if (academicYearId !== undefined) {
      const academicYear = await this.academicYearRepository.findById(
        academicYearId,
        establishmentId,
      );

      if (!academicYear) {
        throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
      }

      return academicYear;
    }

    const currentYear = await this.academicYearRepository.findCurrent(establishmentId);

    if (!currentYear) {
      throw new AppError(
        "No current academic year is defined for this establishment",
        409,
        "NO_CURRENT_ACADEMIC_YEAR",
      );
    }

    return currentYear;
  }
}

const toSubjectEntry = (assignment: {
  id: number;
  coefficient: number;
  subject: { id: number; name: string; code: string };
  teacher: { id: number; firstName: string; lastName: string };
}): SubjectEntry => ({
  classSubjectId: assignment.id,
  subjectId: assignment.subject.id,
  name: assignment.subject.name,
  code: assignment.subject.code,
  coefficient: assignment.coefficient,
  teacher: assignment.teacher,
});
