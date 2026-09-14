import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { CycleRepository } from "../cycles/cycle.repository.js";
import { Prisma } from "../../generated/prisma/client.js";

import type { CreateGradeLevelInput, UpdateGradeLevelInput } from "./grade-level.dto.js";
import { GradeLevelRepository } from "./grade-level.repository.js";

export class GradeLevelService {
  constructor(
    private readonly gradeLevelRepository = new GradeLevelRepository(),
    private readonly cycleRepository = new CycleRepository(),
  ) {}

  list(establishmentId: number, cycleId?: number) {
    return this.gradeLevelRepository.findMany(establishmentId, cycleId);
  }

  async get(id: number, establishmentId: number) {
    const gradeLevel = await this.gradeLevelRepository.findById(id, establishmentId);

    if (!gradeLevel) {
      throw new AppError("Grade level not found", 404, "GRADE_LEVEL_NOT_FOUND");
    }

    return gradeLevel;
  }

  private async ensureCycleExists(cycleId: number, establishmentId: number) {
    const cycle = await this.cycleRepository.findById(cycleId, establishmentId);

    if (!cycle) {
      throw new AppError("Cycle not found", 404, "CYCLE_NOT_FOUND");
    }
  }

  async create(establishmentId: number, input: CreateGradeLevelInput) {
    await this.ensureCycleExists(input.cycleId, establishmentId);

    try {
      const { cycleId, ...rest } = input;

      return await this.gradeLevelRepository.create({
        ...rest,
        cycle: { connect: { id: cycleId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateGradeLevelInput) {
    await this.get(id, establishmentId);

    if (input.cycleId !== undefined) {
      await this.ensureCycleExists(input.cycleId, establishmentId);
    }

    try {
      const { cycleId, ...rest } = input;

      return await this.gradeLevelRepository.update(id, {
        ...stripUndefined(rest),
        ...(cycleId !== undefined ? { cycle: { connect: { id: cycleId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.gradeLevelRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A grade level with this code already exists for this cycle",
        409,
        "GRADE_LEVEL_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
