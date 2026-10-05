import { AppError } from "../../common/errors/app-error.js";
import type { AccessScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { StudentRepository } from "../students/student.repository.js";

import type {
  CreateVaccinationInput,
  CreateVisitInput,
  SaveMedicalRecordInput,
  UpdateVaccinationInput,
  UpdateVisitInput,
} from "./health-record.dto.js";
import { HealthRecordRepository } from "./health-record.repository.js";

export class HealthRecordService {
  constructor(
    private readonly healthRepository = new HealthRecordRepository(),
    private readonly studentRepository = new StudentRepository(),
  ) {}

  listRecords(scope: AccessScope) {
    return this.healthRepository.findRecords(scope.establishmentId);
  }

  /** Un élève sans dossier n'est pas une erreur : il n'a simplement rien de consigné. */
  async getRecord(studentId: number, scope: AccessScope) {
    await this.ensureStudentExists(studentId, scope);

    return this.healthRepository.findRecordByStudent(studentId, scope.establishmentId);
  }

  async saveRecord(studentId: number, scope: AccessScope, input: SaveMedicalRecordInput) {
    await this.ensureStudentExists(studentId, scope);

    return this.healthRepository.upsertRecord(studentId, stripUndefined(input));
  }

  async addVaccination(scope: AccessScope, input: CreateVaccinationInput) {
    const { studentId, ...rest } = input;

    await this.ensureStudentExists(studentId, scope);

    // Le vaccin se rattache au dossier, créé au besoin par la même occasion.
    const record = await this.healthRepository.upsertRecord(studentId, {});

    return this.healthRepository.createVaccination({
      medicalRecordId: record.id,
      name: rest.name,
      date: rest.date,
      nextDueDate: rest.nextDueDate ?? null,
    });
  }

  async updateVaccination(id: number, scope: AccessScope, input: UpdateVaccinationInput) {
    await this.ensureVaccinationExists(id, scope);

    return this.healthRepository.updateVaccination(id, stripUndefined(input));
  }

  async removeVaccination(id: number, scope: AccessScope) {
    await this.ensureVaccinationExists(id, scope);

    return this.healthRepository.deleteVaccination(id);
  }

  listVisits(scope: AccessScope, studentId?: number) {
    return this.healthRepository.findVisits(scope.establishmentId, studentId);
  }

  async createVisit(scope: AccessScope, input: CreateVisitInput) {
    const { studentId, ...rest } = input;

    await this.ensureStudentExists(studentId, scope);

    return this.healthRepository.createVisit({
      studentId,
      reason: rest.reason,
      treatment: rest.treatment ?? null,
      temperature: rest.temperature ?? null,
      notifiedParent: rest.notifiedParent ?? false,
      ...(rest.date !== undefined ? { date: rest.date } : {}),
      // Le passage est consigné au nom de qui l'a traité.
      handledById: scope.userId,
    });
  }

  async updateVisit(id: number, scope: AccessScope, input: UpdateVisitInput) {
    await this.ensureVisitExists(id, scope);

    return this.healthRepository.updateVisit(id, stripUndefined(input));
  }

  async removeVisit(id: number, scope: AccessScope) {
    await this.ensureVisitExists(id, scope);

    return this.healthRepository.deleteVisit(id);
  }

  private async ensureStudentExists(studentId: number, scope: AccessScope) {
    if (!(await this.studentRepository.findById(studentId, scope.establishmentId))) {
      throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }
  }

  private async ensureVaccinationExists(id: number, scope: AccessScope) {
    if (!(await this.healthRepository.findVaccination(id, scope.establishmentId))) {
      throw new AppError("Vaccination not found", 404, "VACCINATION_NOT_FOUND");
    }
  }

  private async ensureVisitExists(id: number, scope: AccessScope) {
    if (!(await this.healthRepository.findVisit(id, scope.establishmentId))) {
      throw new AppError("Infirmary visit not found", 404, "INFIRMARY_VISIT_NOT_FOUND");
    }
  }
}
