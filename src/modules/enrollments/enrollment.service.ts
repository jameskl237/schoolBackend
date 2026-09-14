import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";
import { ClassRepository } from "../classes/class.repository.js";
import { Prisma } from "../../generated/prisma/client.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateEnrollmentInput, UpdateEnrollmentInput } from "./enrollment.dto.js";
import { EnrollmentRepository, type EnrollmentFilters } from "./enrollment.repository.js";

export class EnrollmentService {
  constructor(
    private readonly enrollmentRepository = new EnrollmentRepository(),
    private readonly studentRepository = new StudentRepository(),
    private readonly classRepository = new ClassRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
  ) {}

  list(establishmentId: number, filters: EnrollmentFilters) {
    return this.enrollmentRepository.findMany(establishmentId, filters);
  }

  async get(id: number, establishmentId: number) {
    const enrollment = await this.enrollmentRepository.findById(id, establishmentId);

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404, "ENROLLMENT_NOT_FOUND");
    }

    return enrollment;
  }

  private async ensureStudentExists(studentId: number, establishmentId: number) {
    const student = await this.studentRepository.findById(studentId, establishmentId);

    if (!student) {
      throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }
  }

  private async ensureClassExists(classId: number, establishmentId: number) {
    const classEntity = await this.classRepository.findById(classId, establishmentId);

    if (!classEntity) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }
  }

  private async ensureAcademicYearExists(academicYearId: number, establishmentId: number) {
    const academicYear = await this.academicYearRepository.findById(academicYearId, establishmentId);

    if (!academicYear) {
      throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
    }
  }

  async create(establishmentId: number, input: CreateEnrollmentInput) {
    await this.ensureStudentExists(input.studentId, establishmentId);
    await this.ensureClassExists(input.classId, establishmentId);
    await this.ensureAcademicYearExists(input.academicYearId, establishmentId);

    try {
      const { studentId, classId, academicYearId, ...rest } = input;

      return await this.enrollmentRepository.create({
        ...stripUndefined(rest),
        student: { connect: { id: studentId } },
        class: { connect: { id: classId } },
        academicYear: { connect: { id: academicYearId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateEnrollmentInput) {
    await this.get(id, establishmentId);

    if (input.classId !== undefined) {
      await this.ensureClassExists(input.classId, establishmentId);
    }

    if (input.academicYearId !== undefined) {
      await this.ensureAcademicYearExists(input.academicYearId, establishmentId);
    }

    try {
      const { classId, academicYearId, ...rest } = input;

      return await this.enrollmentRepository.update(id, {
        ...stripUndefined(rest),
        ...(classId !== undefined ? { class: { connect: { id: classId } } } : {}),
        ...(academicYearId !== undefined ? { academicYear: { connect: { id: academicYearId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.enrollmentRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "This student is already enrolled for this academic year",
        409,
        "ENROLLMENT_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
