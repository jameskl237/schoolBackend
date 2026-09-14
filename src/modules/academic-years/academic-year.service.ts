import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";

import type { CreateAcademicYearInput, UpdateAcademicYearInput } from "./academic-year.dto.js";
import { AcademicYearRepository } from "./academic-year.repository.js";

export class AcademicYearService {
  constructor(private readonly academicYearRepository = new AcademicYearRepository()) {}

  list(establishmentId: number) {
    return this.academicYearRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const academicYear = await this.academicYearRepository.findById(id, establishmentId);

    if (!academicYear) {
      throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
    }

    return academicYear;
  }

  async create(establishmentId: number, input: CreateAcademicYearInput) {
    try {
      if (input.isCurrent) {
        await this.academicYearRepository.unsetCurrentExcept(establishmentId);
      }

      const { isCurrent, ...requiredFields } = input;

      return await this.academicYearRepository.create({
        ...requiredFields,
        ...(isCurrent !== undefined ? { isCurrent } : {}),
        establishment: { connect: { id: establishmentId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateAcademicYearInput) {
    await this.get(id, establishmentId);

    try {
      if (input.isCurrent) {
        await this.academicYearRepository.unsetCurrentExcept(establishmentId, id);
      }

      return await this.academicYearRepository.update(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.academicYearRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "An academic year with this name already exists",
        409,
        "ACADEMIC_YEAR_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
