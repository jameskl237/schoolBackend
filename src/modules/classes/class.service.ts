import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { ClassroomRepository } from "../classrooms/classroom.repository.js";
import { Prisma } from "../../generated/prisma/client.js";
import { GradeLevelRepository } from "../grade-levels/grade-level.repository.js";
import { TeacherRepository } from "../teachers/teacher.repository.js";

import type { CreateClassInput, UpdateClassInput } from "./class.dto.js";
import { ClassRepository } from "./class.repository.js";

export class ClassService {
  constructor(
    private readonly classRepository = new ClassRepository(),
    private readonly gradeLevelRepository = new GradeLevelRepository(),
    private readonly classroomRepository = new ClassroomRepository(),
    private readonly teacherRepository = new TeacherRepository(),
  ) {}

  list(establishmentId: number, gradeLevelId?: number) {
    return this.classRepository.findMany(establishmentId, gradeLevelId);
  }

  async get(id: number, establishmentId: number) {
    const classEntity = await this.classRepository.findById(id, establishmentId);

    if (!classEntity) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    return classEntity;
  }

  private async ensureGradeLevelExists(gradeLevelId: number, establishmentId: number) {
    const gradeLevel = await this.gradeLevelRepository.findById(gradeLevelId, establishmentId);

    if (!gradeLevel) {
      throw new AppError("Grade level not found", 404, "GRADE_LEVEL_NOT_FOUND");
    }
  }

  /** A classroom can only ever host one class at a time. */
  private async ensureClassroomIsAvailable(
    classroomId: number,
    establishmentId: number,
    currentClassId?: number,
  ) {
    const classroom = await this.classroomRepository.findById(classroomId, establishmentId);

    if (!classroom) {
      throw new AppError("Classroom not found", 404, "CLASSROOM_NOT_FOUND");
    }

    if (classroom.class && classroom.class.id !== currentClassId) {
      throw new AppError(
        "This classroom is already assigned to another class",
        409,
        "CLASSROOM_ALREADY_ASSIGNED",
      );
    }
  }

  async create(establishmentId: number, input: CreateClassInput) {
    await this.ensureGradeLevelExists(input.gradeLevelId, establishmentId);

    if (input.classroomId !== undefined) {
      await this.ensureClassroomIsAvailable(input.classroomId, establishmentId);
    }

    if (input.mainTeacherId !== undefined) {
      await this.ensureTeacherExists(input.mainTeacherId, establishmentId);
    }

    try {
      const { gradeLevelId, classroomId, mainTeacherId, ...rest } = input;

      return await this.classRepository.create({
        ...rest,
        gradeLevel: { connect: { id: gradeLevelId } },
        ...(classroomId !== undefined ? { classroom: { connect: { id: classroomId } } } : {}),
        ...(mainTeacherId !== undefined ? { mainTeacher: { connect: { id: mainTeacherId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateClassInput) {
    await this.get(id, establishmentId);

    if (input.gradeLevelId !== undefined) {
      await this.ensureGradeLevelExists(input.gradeLevelId, establishmentId);
    }

    if (input.classroomId) {
      await this.ensureClassroomIsAvailable(input.classroomId, establishmentId, id);
    }

    if (typeof input.mainTeacherId === "number") {
      await this.ensureTeacherExists(input.mainTeacherId, establishmentId);
    }

    try {
      const { gradeLevelId, classroomId, mainTeacherId, ...rest } = input;

      return await this.classRepository.update(id, {
        ...stripUndefined(rest),
        ...(gradeLevelId !== undefined ? { gradeLevel: { connect: { id: gradeLevelId } } } : {}),
        ...(classroomId !== undefined
          ? { classroom: classroomId === null ? { disconnect: true } : { connect: { id: classroomId } } }
          : {}),
        ...(mainTeacherId === undefined
          ? {}
          : mainTeacherId === null
            ? { mainTeacher: { disconnect: true } }
            : { mainTeacher: { connect: { id: mainTeacherId } } }),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.classRepository.delete(id);
  }

  private async ensureTeacherExists(teacherId: number, establishmentId: number) {
    if (!(await this.teacherRepository.findById(teacherId, establishmentId))) {
      throw new AppError("Teacher not found", 404, "TEACHER_NOT_FOUND");
    }
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A class with this code already exists for this grade level",
        409,
        "CLASS_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
