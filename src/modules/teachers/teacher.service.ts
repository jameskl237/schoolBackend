import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

import type { CreateTeacherInput, UpdateTeacherInput } from "./teacher.dto.js";
import { TeacherRepository } from "./teacher.repository.js";

export class TeacherService {
  constructor(private readonly teacherRepository = new TeacherRepository()) {}

  list(establishmentId: number) {
    return this.teacherRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const teacher = await this.teacherRepository.findById(id, establishmentId);

    if (!teacher) {
      throw new AppError("Teacher not found", 404, "TEACHER_NOT_FOUND");
    }

    return teacher;
  }

  async create(establishmentId: number, input: CreateTeacherInput) {
    const { userId, phone, email, hireDate, specialty, ...required } = input;

    if (userId !== undefined) {
      await this.ensureUserExists(userId, establishmentId);
    }

    try {
      return await this.teacherRepository.create({
        ...required,
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(hireDate !== undefined ? { hireDate } : {}),
        ...(specialty !== undefined ? { specialty } : {}),
        establishment: { connect: { id: establishmentId } },
        ...(userId !== undefined ? { user: { connect: { id: userId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateTeacherInput) {
    await this.get(id, establishmentId);

    const { userId, ...fields } = input;

    if (typeof userId === "number") {
      await this.ensureUserExists(userId, establishmentId);
    }

    try {
      return await this.teacherRepository.update(id, {
        ...stripUndefined(fields),
        ...(userId === undefined
          ? {}
          : userId === null
            ? { user: { disconnect: true } }
            : { user: { connect: { id: userId } } }),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.teacherRepository.delete(id);
  }

  private async ensureUserExists(userId: number, establishmentId: number) {
    const user = await prisma.user.findFirst({ where: { id: userId, establishmentId } });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A teacher with this employee number or user account already exists",
        409,
        "TEACHER_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
