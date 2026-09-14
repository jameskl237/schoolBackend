import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import type { DayOfWeek } from "../../generated/prisma/client.js";
import { ClassSubjectRepository } from "../class-subjects/class-subject.repository.js";
import { ClassroomRepository } from "../classrooms/classroom.repository.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateTimetableInput, UpdateTimetableInput } from "./timetable.dto.js";
import { TimetableRepository, type TimetableFilters } from "./timetable.repository.js";

export class TimetableService {
  constructor(
    private readonly timetableRepository = new TimetableRepository(),
    private readonly classSubjectRepository = new ClassSubjectRepository(),
    private readonly classroomRepository = new ClassroomRepository(),
    private readonly studentRepository = new StudentRepository(),
  ) {}

  /** Chacun consulte son emploi du temps : sa classe pour l'élève, ses cours pour l'enseignant. */
  async list(scope: AccessScope, filters: TimetableFilters) {
    if (can(scope, "timetables.manage")) {
      return this.timetableRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.teacherId !== undefined) {
      return this.timetableRepository.findMany(scope.establishmentId, {
        ...filters,
        teacherId: scope.teacherId,
      });
    }

    if (scope.studentId !== undefined) {
      const classId = await this.findStudentClassId(scope);

      if (classId === undefined) {
        return [];
      }

      return this.timetableRepository.findMany(scope.establishmentId, { ...filters, classId });
    }

    return [];
  }

  async get(id: number, scope: AccessScope) {
    const timetable = await this.getById(id, scope.establishmentId);

    const isVisible =
      can(scope, "timetables.manage") ||
      (scope.teacherId !== undefined && timetable.classSubject.teacherId === scope.teacherId) ||
      (scope.studentId !== undefined &&
        (await this.findStudentClassId(scope)) === timetable.classSubject.class.id);

    if (!isVisible) {
      throw new AppError("Timetable slot not found", 404, "TIMETABLE_NOT_FOUND");
    }

    return timetable;
  }

  private async getById(id: number, establishmentId: number) {
    const timetable = await this.timetableRepository.findById(id, establishmentId);

    if (!timetable) {
      throw new AppError("Timetable slot not found", 404, "TIMETABLE_NOT_FOUND");
    }

    return timetable;
  }

  async create(establishmentId: number, input: CreateTimetableInput) {
    const { classSubjectId, classroomId, dayOfWeek, startTime, endTime } = input;

    this.ensureTimeRange(startTime, endTime);

    const classSubject = await this.loadClassSubject(classSubjectId, establishmentId);

    await this.ensureClassroomExists(classroomId, establishmentId);
    await this.ensureNoConflict({
      dayOfWeek,
      startTime,
      endTime,
      classroomId,
      teacherId: classSubject.teacherId,
      classId: classSubject.classId,
    });

    return this.timetableRepository.create({
      dayOfWeek,
      startTime,
      endTime,
      classSubject: { connect: { id: classSubjectId } },
      classroom: { connect: { id: classroomId } },
    });
  }

  async update(id: number, establishmentId: number, input: UpdateTimetableInput) {
    const timetable = await this.getById(id, establishmentId);

    const dayOfWeek = input.dayOfWeek ?? timetable.dayOfWeek;
    const startTime = input.startTime ?? timetable.startTime;
    const endTime = input.endTime ?? timetable.endTime;
    const classroomId = input.classroomId ?? timetable.classroomId;

    this.ensureTimeRange(startTime, endTime);

    if (input.classroomId !== undefined) {
      await this.ensureClassroomExists(classroomId, establishmentId);
    }

    await this.ensureNoConflict({
      dayOfWeek,
      startTime,
      endTime,
      classroomId,
      teacherId: timetable.classSubject.teacherId,
      classId: timetable.classSubject.class.id,
      excludeId: id,
    });

    return this.timetableRepository.update(id, {
      dayOfWeek,
      startTime,
      endTime,
      ...(input.classroomId !== undefined ? { classroom: { connect: { id: classroomId } } } : {}),
    });
  }

  async remove(id: number, establishmentId: number) {
    await this.getById(id, establishmentId);

    return this.timetableRepository.delete(id);
  }

  private ensureTimeRange(startTime: Date, endTime: Date) {
    if (startTime >= endTime) {
      throw new AppError(
        "The slot start time must precede its end time",
        400,
        "INVALID_TIME_RANGE",
      );
    }
  }

  private async ensureNoConflict(params: {
    dayOfWeek: DayOfWeek;
    startTime: Date;
    endTime: Date;
    classroomId: number;
    teacherId: number;
    classId: number;
    excludeId?: number;
  }) {
    const conflicts = await this.timetableRepository.findConflicts(params);

    if (conflicts.length === 0) {
      return;
    }

    const conflict = conflicts[0]!;
    const reason =
      conflict.classroomId === params.classroomId
        ? "the classroom is already booked"
        : conflict.classSubject.teacherId === params.teacherId
          ? "the teacher already has a class"
          : "the class already has a course";

    throw new AppError(
      `This slot overlaps an existing one: ${reason}`,
      409,
      "TIMETABLE_CONFLICT",
    );
  }

  private async loadClassSubject(classSubjectId: number, establishmentId: number) {
    const classSubject = await this.classSubjectRepository.findById(
      classSubjectId,
      establishmentId,
    );

    if (!classSubject) {
      throw new AppError("Class subject not found", 404, "CLASS_SUBJECT_NOT_FOUND");
    }

    return classSubject;
  }

  private async ensureClassroomExists(classroomId: number, establishmentId: number) {
    if (!(await this.classroomRepository.findById(classroomId, establishmentId))) {
      throw new AppError("Classroom not found", 404, "CLASSROOM_NOT_FOUND");
    }
  }

  private async findStudentClassId(scope: AccessScope) {
    const student = await this.studentRepository.findById(
      scope.studentId as number,
      scope.establishmentId,
    );

    return student?.enrollments[0]?.classId;
  }
}
