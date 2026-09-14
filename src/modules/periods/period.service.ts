import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";

import type { CreatePeriodInput, UpdatePeriodInput } from "./period.dto.js";
import { PeriodRepository } from "./period.repository.js";

export class PeriodService {
  constructor(
    private readonly periodRepository = new PeriodRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
  ) {}

  list(establishmentId: number, academicYearId?: number) {
    return this.periodRepository.findMany(establishmentId, academicYearId);
  }

  async get(id: number, establishmentId: number) {
    const period = await this.periodRepository.findById(id, establishmentId);

    if (!period) {
      throw new AppError("Period not found", 404, "PERIOD_NOT_FOUND");
    }

    return period;
  }

  async create(establishmentId: number, input: CreatePeriodInput) {
    const { academicYearId, startDate, endDate, ...rest } = input;

    await this.ensureAcademicYearExists(academicYearId, establishmentId);
    this.ensureDateRange(startDate, endDate);

    try {
      return await this.periodRepository.create({
        ...rest,
        startDate,
        endDate,
        academicYear: { connect: { id: academicYearId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdatePeriodInput) {
    const period = await this.get(id, establishmentId);

    this.ensureDateRange(input.startDate ?? period.startDate, input.endDate ?? period.endDate);

    try {
      return await this.periodRepository.update(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.periodRepository.delete(id);
  }

  private ensureDateRange(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new AppError(
        "The period start date must precede its end date",
        400,
        "INVALID_PERIOD_RANGE",
      );
    }
  }

  private async ensureAcademicYearExists(academicYearId: number, establishmentId: number) {
    if (!(await this.academicYearRepository.findById(academicYearId, establishmentId))) {
      throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
    }
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A period with this order already exists for this academic year",
        409,
        "PERIOD_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
