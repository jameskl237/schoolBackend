import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";

import type { CreateClassroomInput, UpdateClassroomInput } from "./classroom.dto.js";
import { ClassroomRepository } from "./classroom.repository.js";

export class ClassroomService {
  constructor(private readonly classroomRepository = new ClassroomRepository()) {}

  list(establishmentId: number, options: { onlyAvailable?: boolean } = {}) {
    return this.classroomRepository.findMany(establishmentId, options);
  }

  async get(id: number, establishmentId: number) {
    const classroom = await this.classroomRepository.findById(id, establishmentId);

    if (!classroom) {
      throw new AppError("Classroom not found", 404, "CLASSROOM_NOT_FOUND");
    }

    return classroom;
  }

  async create(establishmentId: number, input: CreateClassroomInput) {
    const { name, code, capacity } = input;

    try {
      return await this.classroomRepository.create({
        name,
        code,
        ...(capacity !== undefined ? { capacity } : {}),
        establishment: { connect: { id: establishmentId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateClassroomInput) {
    await this.get(id, establishmentId);

    try {
      return await this.classroomRepository.update(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.classroomRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A classroom with this code already exists",
        409,
        "CLASSROOM_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
