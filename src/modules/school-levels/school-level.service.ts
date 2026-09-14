import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";

import type { CreateSchoolLevelInput, UpdateSchoolLevelInput } from "./school-level.dto.js";
import { SchoolLevelRepository } from "./school-level.repository.js";

export class SchoolLevelService {
  constructor(private readonly schoolLevelRepository = new SchoolLevelRepository()) {}

  list(establishmentId: number) {
    return this.schoolLevelRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const schoolLevel = await this.schoolLevelRepository.findById(id, establishmentId);

    if (!schoolLevel) {
      throw new AppError("School level not found", 404, "SCHOOL_LEVEL_NOT_FOUND");
    }

    return schoolLevel;
  }

  async create(establishmentId: number, input: CreateSchoolLevelInput) {
    try {
      return await this.schoolLevelRepository.create({
        ...input,
        establishment: { connect: { id: establishmentId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateSchoolLevelInput) {
    await this.get(id, establishmentId);

    try {
      return await this.schoolLevelRepository.update(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.schoolLevelRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A school level with this name already exists",
        409,
        "SCHOOL_LEVEL_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
