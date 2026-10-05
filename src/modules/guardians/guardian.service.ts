import { AppError } from "../../common/errors/app-error.js";
import {
  DEFAULT_ACCOUNT_PASSWORD,
  provisionAccount,
  PROFILE_ROLES,
} from "../../common/utils/account-provisioning.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateGuardianInput, StudentLinkInput, UpdateGuardianInput } from "./guardian.dto.js";
import { GuardianRepository, guardianInclude } from "./guardian.repository.js";

export class GuardianService {
  constructor(
    private readonly guardianRepository = new GuardianRepository(),
    private readonly studentRepository = new StudentRepository(),
  ) {}

  list(establishmentId: number) {
    return this.guardianRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const guardian = await this.guardianRepository.findById(id, establishmentId);

    if (!guardian) {
      throw new AppError("Guardian not found", 404, "GUARDIAN_NOT_FOUND");
    }

    return guardian;
  }

  private async assertStudentsBelongToEstablishment(students: StudentLinkInput[], establishmentId: number) {
    for (const { studentId } of students) {
      const student = await this.studentRepository.findById(studentId, establishmentId);

      if (!student) {
        throw new AppError("One or more students are invalid", 400, "INVALID_STUDENTS");
      }
    }
  }

  /** Le tuteur reçoit son compte : sans lui, il ne peut rien consulter. */
  async create(establishmentId: number, input: CreateGuardianInput) {
    const { students, phone, email, address, password, ...required } = input;

    if (students && students.length > 0) {
      await this.assertStudentsBelongToEstablishment(students, establishmentId);
    }

    return prisma.$transaction(async (tx) => {
      const account = await provisionAccount(tx, {
        establishmentId,
        roleName: PROFILE_ROLES.GUARDIAN,
        firstName: required.firstName,
        lastName: required.lastName,
        phone: phone ?? null,
        ...(email !== undefined ? { email } : {}),
        ...(password !== undefined ? { password } : {}),
        emailDomain: "tuteur.local",
        defaultPassword: DEFAULT_ACCOUNT_PASSWORD,
      });

      const guardian = await tx.guardian.create({
        data: {
          ...required,
          ...(phone !== undefined ? { phone } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(address !== undefined ? { address } : {}),
          establishment: { connect: { id: establishmentId } },
          user: { connect: { id: account.userId } },
          ...(students && students.length > 0
            ? {
                studentGuardians: {
                  create: students.map((link) => ({
                    student: { connect: { id: link.studentId } },
                    relationType: link.relationType,
                    isFinanciallyResponsible: link.isFinanciallyResponsible ?? false,
                    canPickup: link.canPickup ?? true,
                  })),
                },
              }
            : {}),
        },
        include: guardianInclude,
      });

      return {
        ...guardian,
        account: { loginEmail: account.loginEmail, password: account.password },
      };
    });
  }

  async update(id: number, establishmentId: number, input: UpdateGuardianInput) {
    await this.get(id, establishmentId);

    const { students, ...fields } = input;

    if (students !== undefined) {
      if (students.length > 0) {
        await this.assertStudentsBelongToEstablishment(students, establishmentId);
      }

      await this.guardianRepository.setStudentLinks(id, students);
    }

    return this.guardianRepository.update(id, stripUndefined(fields));
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.guardianRepository.delete(id);
  }
}
