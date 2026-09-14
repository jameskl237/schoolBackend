import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { NotificationService } from "../notifications/notification.service.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateDisciplineRecordInput, UpdateDisciplineRecordInput } from "./discipline.dto.js";
import { DisciplineRepository, type DisciplineFilters } from "./discipline.repository.js";

export class DisciplineService {
  constructor(
    private readonly disciplineRepository = new DisciplineRepository(),
    private readonly studentRepository = new StudentRepository(),
    private readonly notificationService = new NotificationService(),
  ) {}

  /** Globale pour la vie scolaire, ses classes pour l'enseignant, ses enfants pour le parent. */
  async list(scope: AccessScope, filters: DisciplineFilters) {
    if (can(scope, "students.view.all", "disciplines.manage")) {
      return this.disciplineRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.parentId !== undefined) {
      return this.disciplineRepository.findMany(scope.establishmentId, {
        ...filters,
        parentId: scope.parentId,
      });
    }

    if (scope.studentId !== undefined) {
      return this.disciplineRepository.findMany(scope.establishmentId, {
        ...filters,
        studentId: scope.studentId,
      });
    }

    return [];
  }

  async create(scope: AccessScope, input: CreateDisciplineRecordInput) {
    const student = await this.studentRepository.findById(input.studentId, scope.establishmentId);

    if (!student) {
      throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    const record = await this.disciplineRepository.create({
      student: { connect: { id: input.studentId } },
      type: input.type,
      reason: input.reason,
      date: input.date,
      ...(input.durationDays !== undefined ? { durationDays: input.durationDays } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      issuedBy: { connect: { id: scope.userId } },
    });

    await this.notifyParents(student, record);

    return record;
  }

  async update(id: number, scope: AccessScope, input: UpdateDisciplineRecordInput) {
    await this.get(id, scope);

    return this.disciplineRepository.update(id, stripUndefined(input));
  }

  async remove(id: number, scope: AccessScope) {
    await this.get(id, scope);

    return this.disciplineRepository.delete(id);
  }

  private async get(id: number, scope: AccessScope) {
    const record = await this.disciplineRepository.findById(id, scope.establishmentId);

    if (!record) {
      throw new AppError("Discipline record not found", 404, "DISCIPLINE_NOT_FOUND");
    }

    return record;
  }

  /** Préviens chaque parent ayant un compte de la mesure disciplinaire. */
  private async notifyParents(student: { id: number; firstName: string; lastName: string }, record: { type: string }) {
    const links = await this.studentRepository.findParentUserIds(student.id);

    await this.notificationService.notifyMany(
      links.map((userId) => ({
        userId,
        type: "DISCIPLINE" as const,
        title: "Mesure disciplinaire",
        message: `Une mesure disciplinaire (${record.type}) a été enregistrée concernant ${student.firstName} ${student.lastName}.`,
        link: "/my-children/discipline",
      })),
    );
  }
}