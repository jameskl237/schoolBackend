import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { PeriodRepository } from "../periods/period.repository.js";

import type { CreateSequenceInput, UpdateSequenceInput } from "./sequence.dto.js";
import { SequenceRepository, type SequenceFilters } from "./sequence.repository.js";

export class SequenceService {
  constructor(
    private readonly sequenceRepository = new SequenceRepository(),
    private readonly periodRepository = new PeriodRepository(),
  ) {}

  list(establishmentId: number, filters: SequenceFilters) {
    return this.sequenceRepository.findMany(establishmentId, filters);
  }

  async get(id: number, establishmentId: number) {
    const sequence = await this.sequenceRepository.findById(id, establishmentId);

    if (!sequence) {
      throw new AppError("Sequence not found", 404, "SEQUENCE_NOT_FOUND");
    }

    return sequence;
  }

  async create(establishmentId: number, input: CreateSequenceInput) {
    const { periodId, startDate, endDate, ...rest } = input;

    const period = await this.periodRepository.findById(periodId, establishmentId);

    if (!period) {
      throw new AppError("Period not found", 404, "PERIOD_NOT_FOUND");
    }

    this.ensureDateRange(startDate, endDate);

    try {
      return await this.sequenceRepository.create({
        ...rest,
        startDate,
        endDate,
        period: { connect: { id: periodId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateSequenceInput) {
    const sequence = await this.get(id, establishmentId);

    this.ensureDateRange(input.startDate ?? sequence.startDate, input.endDate ?? sequence.endDate);

    try {
      return await this.sequenceRepository.update(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    const sequence = await this.get(id, establishmentId);

    if (sequence._count.evaluations > 0) {
      throw new AppError(
        "This sequence still carries evaluations and cannot be deleted",
        409,
        "SEQUENCE_NOT_EMPTY",
      );
    }

    return this.sequenceRepository.delete(id);
  }

  private ensureDateRange(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new AppError(
        "The sequence start date must precede its end date",
        400,
        "INVALID_SEQUENCE_RANGE",
      );
    }
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A sequence with this order already exists for this term",
        409,
        "SEQUENCE_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
