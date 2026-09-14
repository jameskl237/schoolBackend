import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";

import type { CreateSubjectInput, UpdateSubjectInput } from "./subject.dto.js";
import { SubjectRepository } from "./subject.repository.js";

export class SubjectService {
  constructor(private readonly subjectRepository = new SubjectRepository()) {}

  list(establishmentId: number) {
    return this.subjectRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const subject = await this.subjectRepository.findById(id, establishmentId);

    if (!subject) {
      throw new AppError("Subject not found", 404, "SUBJECT_NOT_FOUND");
    }

    return subject;
  }

  async create(establishmentId: number, input: CreateSubjectInput) {
    try {
      return await this.subjectRepository.create({
        ...input,
        establishment: { connect: { id: establishmentId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateSubjectInput) {
    await this.get(id, establishmentId);

    try {
      return await this.subjectRepository.update(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.subjectRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError("A subject with this code already exists", 409, "SUBJECT_ALREADY_EXISTS");
    }

    return error;
  }
}
