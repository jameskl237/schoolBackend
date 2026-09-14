import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";

import type { CreateFeeTypeInput, UpdateFeeTypeInput } from "./fee-type.dto.js";
import { FeeTypeRepository } from "./fee-type.repository.js";

export class FeeTypeService {
  constructor(private readonly feeTypeRepository = new FeeTypeRepository()) {}

  list(establishmentId: number) {
    return this.feeTypeRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const feeType = await this.feeTypeRepository.findById(id, establishmentId);

    if (!feeType) {
      throw new AppError("Fee type not found", 404, "FEE_TYPE_NOT_FOUND");
    }

    return feeType;
  }

  async create(establishmentId: number, input: CreateFeeTypeInput) {
    const { description, ...rest } = input;

    try {
      return await this.feeTypeRepository.create({
        ...rest,
        ...(description !== undefined ? { description } : {}),
        establishment: { connect: { id: establishmentId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateFeeTypeInput) {
    await this.get(id, establishmentId);

    try {
      return await this.feeTypeRepository.update(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.feeTypeRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError("A fee type with this name already exists", 409, "FEE_TYPE_ALREADY_EXISTS");
    }

    return error;
  }
}
