import { AppError } from "../../common/errors/app-error.js";
import {
  DEFAULT_ACCOUNT_PASSWORD,
  provisionAccount,
  PROFILE_ROLES,
} from "../../common/utils/account-provisioning.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateParentInput, StudentLinkInput, UpdateParentInput } from "./parent.dto.js";
import { ParentRepository, parentInclude } from "./parent.repository.js";

export class ParentService {
  constructor(
    private readonly parentRepository = new ParentRepository(),
    private readonly studentRepository = new StudentRepository(),
  ) {}

  list(establishmentId: number) {
    return this.parentRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const parent = await this.parentRepository.findById(id, establishmentId);

    if (!parent) {
      throw new AppError("Parent not found", 404, "PARENT_NOT_FOUND");
    }

    return parent;
  }

  private async assertStudentsBelongToEstablishment(students: StudentLinkInput[], establishmentId: number) {
    for (const { studentId } of students) {
      const student = await this.studentRepository.findById(studentId, establishmentId);

      if (!student) {
        throw new AppError("One or more students are invalid", 400, "INVALID_STUDENTS");
      }
    }
  }

  /** Le parent reçoit son compte : sans lui, il ne peut pas suivre ses enfants. */
  async create(establishmentId: number, input: CreateParentInput) {
    const { students, phone, email, occupation, address, password, ...required } = input;

    if (students && students.length > 0) {
      await this.assertStudentsBelongToEstablishment(students, establishmentId);
    }

    return prisma.$transaction(async (tx) => {
      const account = await provisionAccount(tx, {
        establishmentId,
        roleName: PROFILE_ROLES.PARENT,
        firstName: required.firstName,
        lastName: required.lastName,
        phone: phone ?? null,
        ...(email !== undefined ? { email } : {}),
        ...(password !== undefined ? { password } : {}),
        emailDomain: "parent.local",
        defaultPassword: DEFAULT_ACCOUNT_PASSWORD,
      });

      const parent = await tx.parent.create({
        data: {
          ...required,
          ...(phone !== undefined ? { phone } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(occupation !== undefined ? { occupation } : {}),
          ...(address !== undefined ? { address } : {}),
          establishment: { connect: { id: establishmentId } },
          user: { connect: { id: account.userId } },
          ...(students && students.length > 0
            ? {
                studentParents: {
                  create: students.map((link) => ({
                    student: { connect: { id: link.studentId } },
                    relationType: link.relationType,
                    isPrimaryContact: link.isPrimaryContact ?? false,
                  })),
                },
              }
            : {}),
        },
        include: parentInclude,
      });

      return {
        ...parent,
        account: { loginEmail: account.loginEmail, password: account.password },
      };
    });
  }

  async update(id: number, establishmentId: number, input: UpdateParentInput) {
    await this.get(id, establishmentId);

    const { students, ...fields } = input;

    if (students !== undefined) {
      if (students.length > 0) {
        await this.assertStudentsBelongToEstablishment(students, establishmentId);
      }

      await this.parentRepository.setStudentLinks(id, students);
    }

    return this.parentRepository.update(id, stripUndefined(fields));
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.parentRepository.delete(id);
  }
}
