import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { findMainTeacherClassIds } from "../../common/utils/main-teacher.js";
import { EvaluationRepository } from "../evaluations/evaluation.repository.js";
import type { EvaluationWithContext } from "../evaluations/evaluation.repository.js";
import { StudentRepository } from "../students/student.repository.js";

import type { SaveGradesInput, UpdateGradeInput } from "./grade.dto.js";
import { GradeRepository, type GradeFilters } from "./grade.repository.js";

export class GradeService {
  constructor(
    private readonly gradeRepository = new GradeRepository(),
    private readonly evaluationRepository = new EvaluationRepository(),
    private readonly studentRepository = new StudentRepository(),
  ) {}

  /**
   * Trois lectures possibles : globale pour l'administration, limitée à ses
   * matières pour l'enseignant, limitée à lui-même pour l'élève.
   */
  async list(scope: AccessScope, filters: GradeFilters) {
    if (can(scope, "students.view.all", "report-cards.manage")) {
      return this.gradeRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.teacherId !== undefined) {
      return this.gradeRepository.findMany(scope.establishmentId, {
        ...filters,
        teacherScope: {
          teacherId: scope.teacherId,
          mainClassIds: await findMainTeacherClassIds(scope),
        },
      });
    }

    if (scope.studentId !== undefined) {
      return this.gradeRepository.findMany(scope.establishmentId, {
        ...filters,
        studentId: scope.studentId,
      });
    }

    if (scope.parentId !== undefined) {
      return this.gradeRepository.findMany(scope.establishmentId, {
        ...filters,
        parentId: scope.parentId,
      });
    }

    return [];
  }

  async saveSheet(scope: AccessScope, input: SaveGradesInput) {
    const evaluation = await this.loadOwnedEvaluation(input.evaluationId, scope);

    this.ensureNotValidated(evaluation);

    const classId = evaluation.classSubject.class.id;
    const studentIds = input.grades.map((entry) => entry.studentId);

    await this.ensureStudentsInClass(studentIds, classId, scope.establishmentId);

    for (const entry of input.grades) {
      if (entry.score !== undefined && entry.score !== null && entry.score > evaluation.maxScore) {
        throw new AppError(
          `A score cannot exceed the evaluation maximum (${evaluation.maxScore})`,
          400,
          "SCORE_ABOVE_MAX",
        );
      }
    }

    return this.gradeRepository.saveMany(
      evaluation.id,
      input.grades.map((entry) => ({
        studentId: entry.studentId,
        data: {
          evaluationId: evaluation.id,
          studentId: entry.studentId,
          score: entry.score ?? null,
          isAbsent: entry.isAbsent ?? false,
          comment: entry.comment ?? null,
        },
      })),
    );
  }

  async update(id: number, scope: AccessScope, input: UpdateGradeInput) {
    const grade = await this.gradeRepository.findById(id, scope.establishmentId);

    if (!grade) {
      throw new AppError("Grade not found", 404, "GRADE_NOT_FOUND");
    }

    const evaluation = await this.loadOwnedEvaluation(grade.evaluationId, scope);

    this.ensureNotValidated(evaluation);

    if (input.score !== undefined && input.score !== null && input.score > evaluation.maxScore) {
      throw new AppError(
        `A score cannot exceed the evaluation maximum (${evaluation.maxScore})`,
        400,
        "SCORE_ABOVE_MAX",
      );
    }

    return this.gradeRepository.update(id, {
      ...(input.score !== undefined ? { score: input.score } : {}),
      ...(input.isAbsent !== undefined ? { isAbsent: input.isAbsent } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
    });
  }

  async remove(id: number, scope: AccessScope) {
    const grade = await this.gradeRepository.findById(id, scope.establishmentId);

    if (!grade) {
      throw new AppError("Grade not found", 404, "GRADE_NOT_FOUND");
    }

    const evaluation = await this.loadOwnedEvaluation(grade.evaluationId, scope);

    this.ensureNotValidated(evaluation);

    return this.gradeRepository.delete(id);
  }

  /** La saisie est réservée à l'enseignant de la matière — l'administration n'y touche pas. */
  private async loadOwnedEvaluation(evaluationId: number, scope: AccessScope) {
    const evaluation = await this.evaluationRepository.findById(
      evaluationId,
      scope.establishmentId,
    );

    if (!evaluation) {
      throw new AppError("Evaluation not found", 404, "EVALUATION_NOT_FOUND");
    }

    if (scope.teacherId === undefined || evaluation.classSubject.teacherId !== scope.teacherId) {
      throw new AppError(
        "Only the teacher assigned to this subject can enter its grades",
        403,
        "NOT_EVALUATION_OWNER",
      );
    }

    return evaluation;
  }

  private ensureNotValidated(evaluation: EvaluationWithContext) {
    if (evaluation.validatedAt) {
      throw new AppError(
        "These grades have been validated and can no longer be modified",
        409,
        "EVALUATION_VALIDATED",
      );
    }
  }

  private async ensureStudentsInClass(
    studentIds: number[],
    classId: number,
    establishmentId: number,
  ) {
    const students = await this.studentRepository.findMany(establishmentId, {
      id: { in: studentIds },
      enrollments: { some: { classId } },
    });

    if (students.length !== new Set(studentIds).size) {
      throw new AppError(
        "Some students are not enrolled in this class",
        400,
        "STUDENT_NOT_IN_CLASS",
      );
    }
  }
}
