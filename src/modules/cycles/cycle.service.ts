import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { SectionRepository } from "../sections/section.repository.js";

import type { CreateCycleInput, UpdateCycleInput } from "./cycle.dto.js";
import { CycleRepository } from "./cycle.repository.js";

export class CycleService {
  constructor(
    private readonly cycleRepository = new CycleRepository(),
    private readonly sectionRepository = new SectionRepository(),
  ) {}

  list(establishmentId: number, sectionId?: number) {
    return this.cycleRepository.findMany(establishmentId, sectionId);
  }

  async get(id: number, establishmentId: number) {
    const cycle = await this.cycleRepository.findById(id, establishmentId);

    if (!cycle) {
      throw new AppError("Cycle not found", 404, "CYCLE_NOT_FOUND");
    }

    return cycle;
  }

  private async ensureSectionExists(sectionId: number, establishmentId: number) {
    const section = await this.sectionRepository.findById(sectionId, establishmentId);

    if (!section) {
      throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
    }
  }

  async create(establishmentId: number, input: CreateCycleInput) {
    await this.ensureSectionExists(input.sectionId, establishmentId);

    try {
      const { sectionId, ...rest } = input;

      return await this.cycleRepository.create({
        ...rest,
        section: { connect: { id: sectionId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateCycleInput) {
    await this.get(id, establishmentId);

    if (input.sectionId !== undefined) {
      await this.ensureSectionExists(input.sectionId, establishmentId);
    }

    try {
      const { sectionId, ...rest } = input;

      return await this.cycleRepository.update(id, {
        ...stripUndefined(rest),
        ...(sectionId !== undefined ? { section: { connect: { id: sectionId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.cycleRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A cycle with this code already exists for this section",
        409,
        "CYCLE_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
