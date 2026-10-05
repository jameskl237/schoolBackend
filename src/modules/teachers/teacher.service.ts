import { AppError } from "../../common/errors/app-error.js";
import {
  DEFAULT_ACCOUNT_PASSWORD,
  provisionAccount,
  PROFILE_ROLES,
} from "../../common/utils/account-provisioning.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

import type { CreateTeacherInput, UpdateTeacherInput } from "./teacher.dto.js";
import { TeacherRepository, teacherInclude } from "./teacher.repository.js";

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

  /**
   * Tout enseignant a un compte : sans lui, il ne peut ni saisir ses notes ni
   * recevoir les demandes du professeur principal. À défaut de compte fourni,
   * on en ouvre un avec le rôle ENSEIGNANT et on restitue ses identifiants.
   */
  async create(establishmentId: number, input: CreateTeacherInput) {
    const { userId, phone, email, hireDate, specialty, password, ...required } = input;

    if (userId !== undefined) {
      await this.ensureUserExists(userId, establishmentId);
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const account =
          userId === undefined
            ? await provisionAccount(tx, {
                establishmentId,
                roleName: PROFILE_ROLES.TEACHER,
                firstName: required.firstName,
                lastName: required.lastName,
                phone: phone ?? null,
                ...(email !== undefined ? { email } : {}),
                ...(password !== undefined ? { password } : {}),
                emailDomain: "enseignant.local",
                defaultPassword: DEFAULT_ACCOUNT_PASSWORD,
              })
            : null;

        const teacher = await tx.teacher.create({
          data: {
            ...required,
            ...(phone !== undefined ? { phone } : {}),
            ...(email !== undefined ? { email } : {}),
            ...(hireDate !== undefined ? { hireDate } : {}),
            ...(specialty !== undefined ? { specialty } : {}),
            establishment: { connect: { id: establishmentId } },
            user: { connect: { id: userId ?? (account as { userId: number }).userId } },
          },
          include: teacherInclude,
        });

        return {
          ...teacher,
          account: account
            ? { loginEmail: account.loginEmail, password: account.password }
            : null,
        };
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
