import { AppError } from "../../common/errors/app-error.js";
import type { AccessScope } from "../../common/utils/access-scope.js";
import { isMainTeacherOf } from "../../common/utils/main-teacher.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { EvaluationRepository } from "../evaluations/evaluation.repository.js";
import { NotificationService } from "../notifications/notification.service.js";

import type { CreateReviewInput } from "./evaluation-review.dto.js";
import { EvaluationReviewRepository } from "./evaluation-review.repository.js";

export class EvaluationReviewService {
  constructor(
    private readonly reviewRepository = new EvaluationReviewRepository(),
    private readonly evaluationRepository = new EvaluationRepository(),
    private readonly notificationService = new NotificationService(),
  ) {}

  async list(evaluationId: number, scope: AccessScope) {
    await this.loadVisibleEvaluation(evaluationId, scope);

    return this.reviewRepository.findByEvaluation(evaluationId);
  }

  /**
   * Le professeur principal vise les notes d'une matière de sa classe. S'il
   * demande une correction, l'enseignant de la matière est notifié.
   */
  async create(evaluationId: number, scope: AccessScope, input: CreateReviewInput) {
    const evaluation = await this.loadVisibleEvaluation(evaluationId, scope);

    if (!(await isMainTeacherOf(scope, evaluation.classSubject.class.id))) {
      throw new AppError(
        "Only the main teacher of this class can review its grades",
        403,
        "NOT_MAIN_TEACHER",
      );
    }

    const review = await this.reviewRepository.create({
      evaluationId,
      authorId: scope.userId,
      decision: input.decision,
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
    });

    if (input.decision === "CHANGES_REQUESTED") {
      await this.notifySubjectTeacher(evaluation, input.comment ?? "");
    }

    return review;
  }

  /** L'enseignant de la matière clôt l'avis une fois la correction faite. */
  async resolve(reviewId: number, scope: AccessScope) {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
    }

    const evaluation = await this.loadVisibleEvaluation(review.evaluationId, scope);

    const isSubjectTeacher =
      scope.teacherId !== undefined && evaluation.classSubject.teacherId === scope.teacherId;
    const isMainTeacher = await isMainTeacherOf(scope, evaluation.classSubject.class.id);

    if (!isSubjectTeacher && !isMainTeacher) {
      throw new AppError("You cannot close this review", 403, "NOT_REVIEW_PARTICIPANT");
    }

    if (review.resolvedAt) {
      return review;
    }

    return this.reviewRepository.resolve(reviewId);
  }

  private async loadVisibleEvaluation(evaluationId: number, scope: AccessScope) {
    const evaluation = await this.evaluationRepository.findById(evaluationId, scope.establishmentId);

    if (!evaluation) {
      throw new AppError("Evaluation not found", 404, "EVALUATION_NOT_FOUND");
    }

    return evaluation;
  }

  private async notifySubjectTeacher(
    evaluation: Awaited<ReturnType<EvaluationRepository["findById"]>>,
    comment: string,
  ) {
    if (!evaluation) {
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: evaluation.classSubject.teacherId },
      select: { userId: true },
    });

    // Un enseignant sans compte utilisateur ne peut pas être notifié dans l'application.
    if (!teacher?.userId) {
      return;
    }

    await this.notificationService.notify({
      userId: teacher.userId,
      type: "EVALUATION_REVIEW",
      title: `Notes à revoir — ${evaluation.classSubject.subject.name}`,
      message: `Le professeur principal de ${evaluation.classSubject.class.name} demande une vérification des notes de « ${evaluation.title} ». ${comment}`.trim(),
      link: `/grades?evaluationId=${evaluation.id}`,
    });
  }
}
