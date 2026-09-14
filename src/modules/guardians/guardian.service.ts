import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateGuardianInput, StudentLinkInput, UpdateGuardianInput } from "./guardian.dto.js";
import { GuardianRepository } from "./guardian.repository.js";

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

  async create(establishmentId: number, input: CreateGuardianInput) {
    const { students, phone, email, address, ...required } = input;

    if (students && students.length > 0) {
      await this.assertStudentsBelongToEstablishment(students, establishmentId);
    }

    return this.guardianRepository.create({
      ...required,
      ...(phone !== undefined ? { phone } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(address !== undefined ? { address } : {}),
      establishment: { connect: { id: establishmentId } },
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
