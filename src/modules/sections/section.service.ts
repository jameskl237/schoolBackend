import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { SchoolLevelRepository } from "../school-levels/school-level.repository.js";

import type { CreateSectionInput, UpdateSectionInput } from "./section.dto.js";
import { SectionRepository } from "./section.repository.js";

export class SectionService {
  constructor(
    private readonly sectionRepository = new SectionRepository(),
    private readonly schoolLevelRepository = new SchoolLevelRepository(),
  ) {}

  list(establishmentId: number, schoolLevelId?: number) {
    return this.sectionRepository.findMany(establishmentId, schoolLevelId);
  }

  async get(id: number, establishmentId: number) {
    const section = await this.sectionRepository.findById(id, establishmentId);

    if (!section) {
      throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
    }

    return section;
  }

  private async ensureSchoolLevelExists(schoolLevelId: number, establishmentId: number) {
    const schoolLevel = await this.schoolLevelRepository.findById(schoolLevelId, establishmentId);

    if (!schoolLevel) {
      throw new AppError("School level not found", 404, "SCHOOL_LEVEL_NOT_FOUND");
    }
  }

  async create(establishmentId: number, input: CreateSectionInput) {
    await this.ensureSchoolLevelExists(input.schoolLevelId, establishmentId);

    try {
      const { schoolLevelId, ...rest } = input;

      return await this.sectionRepository.create({
        ...rest,
        schoolLevel: { connect: { id: schoolLevelId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateSectionInput) {
    await this.get(id, establishmentId);

    if (input.schoolLevelId !== undefined) {
      await this.ensureSchoolLevelExists(input.schoolLevelId, establishmentId);
    }

    try {
      const { schoolLevelId, ...rest } = input;

      return await this.sectionRepository.update(id, {
        ...stripUndefined(rest),
        ...(schoolLevelId !== undefined ? { schoolLevel: { connect: { id: schoolLevelId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.sectionRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "This school level already has a section for this language",
        409,
        "SECTION_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
