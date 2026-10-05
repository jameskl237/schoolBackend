import { AppError } from "../../common/errors/app-error.js";
import type { AccessScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";
import { StudentRepository } from "../students/student.repository.js";

import type {
  CreateOrientationInput,
  CreateSessionInput,
  UpdateOrientationInput,
  UpdateSessionInput,
} from "./orientation.dto.js";
import { OrientationRepository, type OrientationFilters } from "./orientation.repository.js";

export class OrientationService {
  constructor(
    private readonly orientationRepository = new OrientationRepository(),
    private readonly studentRepository = new StudentRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
  ) {}

  list(scope: AccessScope, filters: OrientationFilters) {
    return this.orientationRepository.findMany(scope.establishmentId, filters);
  }

  async get(id: number, scope: AccessScope) {
    const record = await this.orientationRepository.findById(id, scope.establishmentId);

    if (!record) {
      throw new AppError("Orientation record not found", 404, "ORIENTATION_NOT_FOUND");
    }

    return record;
  }

  async create(scope: AccessScope, input: CreateOrientationInput) {
    const { studentId, academicYearId, ...rest } = input;

    if (!(await this.studentRepository.findById(studentId, scope.establishmentId))) {
      throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    const yearId = await this.resolveAcademicYearId(scope.establishmentId, academicYearId);

    try {
      return await this.orientationRepository.create({
        studentId,
        academicYearId: yearId,
        recommendedTrack: rest.recommendedTrack ?? null,
        finalDecision: rest.finalDecision ?? null,
        ...(rest.status !== undefined ? { status: rest.status } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, scope: AccessScope, input: UpdateOrientationInput) {
    await this.get(id, scope);

    return this.orientationRepository.update(id, stripUndefined(input));
  }

  async remove(id: number, scope: AccessScope) {
    await this.get(id, scope);

    return this.orientationRepository.delete(id);
  }

  /** La séance est consignée au nom du conseiller qui la tient. */
  async addSession(scope: AccessScope, input: CreateSessionInput) {
    await this.get(input.orientationRecordId, scope);

    return this.orientationRepository.createSession({
      orientationRecordId: input.orientationRecordId,
      counselorId: scope.userId,
      notes: input.notes ?? null,
      followUpDate: input.followUpDate ?? null,
      ...(input.date !== undefined ? { date: input.date } : {}),
    });
  }

  async updateSession(id: number, scope: AccessScope, input: UpdateSessionInput) {
    await this.ensureSessionExists(id, scope);

    return this.orientationRepository.updateSession(id, stripUndefined(input));
  }

  async removeSession(id: number, scope: AccessScope) {
    await this.ensureSessionExists(id, scope);

    return this.orientationRepository.deleteSession(id);
  }

  private async ensureSessionExists(id: number, scope: AccessScope) {
    if (!(await this.orientationRepository.findSession(id, scope.establishmentId))) {
      throw new AppError("Counseling session not found", 404, "COUNSELING_SESSION_NOT_FOUND");
    }
  }

  private async resolveAcademicYearId(establishmentId: number, academicYearId?: number) {
    if (academicYearId !== undefined) {
      if (!(await this.academicYearRepository.findById(academicYearId, establishmentId))) {
        throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
      }

      return academicYearId;
    }

    const currentYear = await this.academicYearRepository.findCurrent(establishmentId);

    if (!currentYear) {
      throw new AppError(
        "No current academic year is defined for this establishment",
        409,
        "NO_CURRENT_ACADEMIC_YEAR",
      );
    }

    return currentYear.id;
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "Cet élève a déjà un dossier d'orientation pour cette année",
        409,
        "ORIENTATION_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
