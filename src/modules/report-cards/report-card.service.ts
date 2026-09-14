import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { NotificationService } from "../notifications/notification.service.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateReportCardInput, UpdateReportCardInput } from "./report-card.dto.js";
import { ReportCardRepository, type ReportCardFilters } from "./report-card.repository.js";

export class ReportCardService {
  constructor(
    private readonly reportCardRepository = new ReportCardRepository(),
    private readonly studentRepository = new StudentRepository(),
    private readonly notificationService = new NotificationService(),
  ) {}

  /** Globale pour l'administration ; seuls les bulletins publiés pour un parent ou un élève. */
  async list(scope: AccessScope, filters: ReportCardFilters) {
    if (can(scope, "students.view.all", "report-cards.manage")) {
      return this.reportCardRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.parentId !== undefined) {
      return this.reportCardRepository.findMany(scope.establishmentId, {
        ...filters,
        parentId: scope.parentId,
        onlyPublished: true,
      });
    }

    if (scope.studentId !== undefined) {
      return this.reportCardRepository.findMany(scope.establishmentId, {
        ...filters,
        studentId: scope.studentId,
        onlyPublished: true,
      });
    }

    return [];
  }

  async create(scope: AccessScope, input: CreateReportCardInput) {
    const student = await this.studentRepository.findById(input.studentId, scope.establishmentId);

    if (!student) {
      throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    const classId = await this.resolveClassId(input.studentId, scope.establishmentId);
    const publishedAt = input.published ? new Date() : null;

    const reportCard = await this.reportCardRepository.create({
      student: { connect: { id: input.studentId } },
      period: { connect: { id: input.periodId } },
      class: { connect: { id: classId } },
      generalAverage: input.generalAverage ?? null,
      rank: input.rank ?? null,
      conduct: input.conduct ?? null,
      appreciation: input.appreciation ?? null,
      publishedAt,
    });

    if (input.lines !== undefined) {
      await this.reportCardRepository.replaceLines(reportCard.id, input.lines);
    }

    const created = await this.reportCardRepository.findById(reportCard.id, scope.establishmentId);

    if (created) {
      await this.notifyParentsOnPublish(created);
    }

    return created;
  }

  async update(id: number, scope: AccessScope, input: UpdateReportCardInput) {
    const reportCard = await this.get(id, scope);

    const wasPublished = reportCard.publishedAt !== null;
    const willPublish = input.published === true && !wasPublished;

    if (input.published !== undefined) {
      await this.reportCardRepository.update(id, {
        publishedAt: input.published ? new Date() : null,
      });
    }

    const data = stripUndefined({
      generalAverage: input.generalAverage,
      rank: input.rank,
      conduct: input.conduct,
      appreciation: input.appreciation,
    });

    if (Object.keys(data).length > 0) {
      await this.reportCardRepository.update(id, data);
    }

    if (input.lines !== undefined) {
      await this.reportCardRepository.replaceLines(id, input.lines);
    }

    const updated = await this.reportCardRepository.findById(id, scope.establishmentId);

    if (updated && willPublish) {
      await this.notifyParentsOnPublish(updated);
    }

    return updated;
  }

  async remove(id: number, scope: AccessScope) {
    await this.get(id, scope);

    return this.reportCardRepository.delete(id);
  }

  private async get(id: number, scope: AccessScope) {
    const reportCard = await this.reportCardRepository.findById(id, scope.establishmentId);

    if (!reportCard) {
      throw new AppError("Report card not found", 404, "REPORT_CARD_NOT_FOUND");
    }

    return reportCard;
  }

  /** La classe est celle de l'inscription courante de l'élève si elle n'est pas fournie. */
  private async resolveClassId(studentId: number, establishmentId: number) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, student: { establishmentId } },
      orderBy: { academicYear: { startDate: "desc" } },
      select: { classId: true },
    });

    if (!enrollment) {
      throw new AppError("This student is not enrolled in any class", 409, "NO_ENROLLMENT");
    }

    return enrollment.classId;
  }

  /** Préviens les parents de l'élève de la mise à disposition du bulletin. */
  private async notifyParentsOnPublish(reportCard: {
    student: { id: number; firstName: string; lastName: string };
    period: { name: string };
  }) {
    const links = await this.studentRepository.findParentUserIds(reportCard.student.id);

    await this.notificationService.notifyMany(
      links.map((userId) => ({
        userId,
        type: "REPORT_CARD" as const,
        title: "Bulletin disponible",
        message: `Le bulletin de ${reportCard.student.firstName} ${reportCard.student.lastName} (${reportCard.period.name}) est disponible.`,
        link: "/my-children/report-cards",
      })),
    );
  }
}