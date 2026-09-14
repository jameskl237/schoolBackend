import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { findMainTeacherClassIds, isMainTeacherOf } from "../../common/utils/main-teacher.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { ClassSubjectRepository } from "../class-subjects/class-subject.repository.js";
import { PeriodRepository } from "../periods/period.repository.js";
import { SequenceRepository } from "../sequences/sequence.repository.js";

import type { CreateEvaluationInput, UpdateEvaluationInput } from "./evaluation.dto.js";
import {
  EvaluationRepository,
  type EvaluationFilters,
  type EvaluationWithContext,
} from "./evaluation.repository.js";

export class EvaluationService {
  constructor(
    private readonly evaluationRepository = new EvaluationRepository(),
    private readonly classSubjectRepository = new ClassSubjectRepository(),
    private readonly periodRepository = new PeriodRepository(),
    private readonly sequenceRepository = new SequenceRepository(),
  ) {}

  /**
   * L'enseignant ne voit que ses propres matières — plus, s'il est professeur
   * principal, toutes les matières de ses classes.
   */
  async list(scope: AccessScope, filters: EvaluationFilters) {
    if (this.hasGlobalView(scope)) {
      return this.evaluationRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.teacherId === undefined) {
      return [];
    }

    return this.evaluationRepository.findMany(scope.establishmentId, {
      ...filters,
      teacherScope: {
        teacherId: scope.teacherId,
        mainClassIds: await findMainTeacherClassIds(scope),
      },
    });
  }

  async get(id: number, scope: AccessScope) {
    const evaluation = await this.evaluationRepository.findById(id, scope.establishmentId);

    if (!evaluation || !(await this.isVisibleTo(evaluation, scope))) {
      throw new AppError("Evaluation not found", 404, "EVALUATION_NOT_FOUND");
    }

    return evaluation;
  }

  async create(scope: AccessScope, input: CreateEvaluationInput) {
    const { classSubjectId, periodId, sequenceId, maxScore, coefficient, ...required } = input;

    await this.ensureOwnedClassSubject(classSubjectId, scope);
    await this.ensurePeriodExists(periodId, scope.establishmentId);
    await this.ensureSequenceBelongsToPeriod(sequenceId, periodId, scope.establishmentId);

    return this.evaluationRepository.create({
      ...required,
      ...(maxScore !== undefined ? { maxScore } : {}),
      ...(coefficient !== undefined ? { coefficient } : {}),
      classSubject: { connect: { id: classSubjectId } },
      period: { connect: { id: periodId } },
      sequence: { connect: { id: sequenceId } },
    });
  }

  async update(id: number, scope: AccessScope, input: UpdateEvaluationInput) {
    const evaluation = await this.get(id, scope);

    this.ensureOwner(evaluation, scope);
    this.ensureNotValidated(evaluation);

    const { periodId, sequenceId, ...rest } = input;
    const targetPeriodId = periodId ?? evaluation.periodId;

    if (periodId !== undefined) {
      await this.ensurePeriodExists(periodId, scope.establishmentId);
    }

    if (sequenceId !== undefined) {
      await this.ensureSequenceBelongsToPeriod(sequenceId, targetPeriodId, scope.establishmentId);
    }

    return this.evaluationRepository.update(id, {
      ...stripUndefined(rest),
      ...(periodId !== undefined ? { period: { connect: { id: periodId } } } : {}),
      ...(sequenceId !== undefined ? { sequence: { connect: { id: sequenceId } } } : {}),
    });
  }

  /** Validation : fige les notes de l'évaluation pour tous, administration comprise. */
  async validate(id: number, scope: AccessScope) {
    const evaluation = await this.get(id, scope);

    this.ensureOwner(evaluation, scope);

    if (evaluation.validatedAt) {
      return evaluation;
    }

    return this.evaluationRepository.update(id, {
      validatedAt: new Date(),
      validatedBy: { connect: { id: scope.userId } },
    });
  }

  /** Réouverture : réservée à l'enseignant propriétaire, jamais à l'administration. */
  async reopen(id: number, scope: AccessScope) {
    const evaluation = await this.get(id, scope);

    this.ensureOwner(evaluation, scope);

    if (!evaluation.validatedAt) {
      return evaluation;
    }

    return this.evaluationRepository.update(id, {
      validatedAt: null,
      validatedBy: { disconnect: true },
    });
  }

  async remove(id: number, scope: AccessScope) {
    const evaluation = await this.get(id, scope);

    this.ensureOwner(evaluation, scope);
    this.ensureNotValidated(evaluation);

    return this.evaluationRepository.delete(id);
  }

  private hasGlobalView(scope: AccessScope) {
    return can(scope, "students.view.all", "report-cards.manage");
  }

  private async isVisibleTo(evaluation: EvaluationWithContext, scope: AccessScope) {
    if (this.hasGlobalView(scope)) {
      return true;
    }

    if (scope.teacherId !== undefined && evaluation.classSubject.teacherId === scope.teacherId) {
      return true;
    }

    return isMainTeacherOf(scope, evaluation.classSubject.class.id);
  }

  /**
   * La saisie appartient à l'enseignant de la matière : personne ne note à sa place,
   * pas même un administrateur qui aurait la vision globale.
   */
  private ensureOwner(evaluation: EvaluationWithContext, scope: AccessScope) {
    if (scope.teacherId === undefined || evaluation.classSubject.teacherId !== scope.teacherId) {
      throw new AppError(
        "Only the teacher assigned to this subject can act on this evaluation",
        403,
        "NOT_EVALUATION_OWNER",
      );
    }
  }

  private ensureNotValidated(evaluation: EvaluationWithContext) {
    if (evaluation.validatedAt) {
      throw new AppError(
        "This evaluation has been validated and can no longer be modified",
        409,
        "EVALUATION_VALIDATED",
      );
    }
  }

  private async ensureOwnedClassSubject(classSubjectId: number, scope: AccessScope) {
    const classSubject = await this.classSubjectRepository.findById(
      classSubjectId,
      scope.establishmentId,
    );

    if (!classSubject) {
      throw new AppError("Class subject not found", 404, "CLASS_SUBJECT_NOT_FOUND");
    }

    if (scope.teacherId === undefined || classSubject.teacherId !== scope.teacherId) {
      throw new AppError(
        "Only the teacher assigned to this subject can create its evaluations",
        403,
        "NOT_CLASS_SUBJECT_OWNER",
      );
    }
  }

  private async ensurePeriodExists(periodId: number, establishmentId: number) {
    if (!(await this.periodRepository.findById(periodId, establishmentId))) {
      throw new AppError("Period not found", 404, "PERIOD_NOT_FOUND");
    }
  }

  /** Une évaluation séquentielle ne peut pas pointer une séquence d'un autre trimestre. */
  private async ensureSequenceBelongsToPeriod(
    sequenceId: number,
    periodId: number,
    establishmentId: number,
  ) {
    const sequence = await this.sequenceRepository.findById(sequenceId, establishmentId);

    if (!sequence) {
      throw new AppError("Sequence not found", 404, "SEQUENCE_NOT_FOUND");
    }

    if (sequence.periodId !== periodId) {
      throw new AppError(
        "This sequence does not belong to the selected term",
        400,
        "SEQUENCE_PERIOD_MISMATCH",
      );
    }
  }
}
