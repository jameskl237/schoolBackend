import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { ClassRepository } from "../classes/class.repository.js";
import { StudentRepository } from "../students/student.repository.js";

import type { SaveAttendancesInput, UpdateAttendanceInput } from "./attendance.dto.js";
import { AttendanceRepository, type AttendanceFilters } from "./attendance.repository.js";

export class AttendanceService {
  constructor(
    private readonly attendanceRepository = new AttendanceRepository(),
    private readonly classRepository = new ClassRepository(),
    private readonly studentRepository = new StudentRepository(),
  ) {}

  /** Vision globale pour la vie scolaire, ses classes pour l'enseignant, lui-même pour l'élève. */
  list(scope: AccessScope, filters: AttendanceFilters) {
    if (can(scope, "students.view.all", "attendances.manage") && scope.teacherId === undefined) {
      return this.attendanceRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.teacherId !== undefined) {
      return this.attendanceRepository.findMany(scope.establishmentId, {
        ...filters,
        teacherId: scope.teacherId,
      });
    }

    if (scope.studentId !== undefined) {
      return this.attendanceRepository.findMany(scope.establishmentId, {
        ...filters,
        studentId: scope.studentId,
      });
    }

    if (scope.parentId !== undefined) {
      return this.attendanceRepository.findMany(scope.establishmentId, {
        ...filters,
        parentId: scope.parentId,
      });
    }

    return Promise.resolve([]);
  }

  async saveSheet(scope: AccessScope, input: SaveAttendancesInput) {
    await this.ensureClassIsTaughtBy(input.classId, scope);

    const studentIds = input.entries.map((entry) => entry.studentId);

    await this.ensureStudentsInClass(studentIds, input.classId, scope.establishmentId);

    if (input.timetableId !== undefined) {
      await this.ensureTimetableBelongsToClass(input.timetableId, input.classId);
    }

    return this.attendanceRepository.replaceSheet(
      {
        classId: input.classId,
        date: input.date,
        timetableId: input.timetableId ?? null,
      },
      input.entries.map((entry) => ({
        studentId: entry.studentId,
        classId: input.classId,
        date: input.date,
        status: entry.status,
        justification: entry.justification ?? null,
        timetableId: input.timetableId ?? null,
        recordedById: scope.userId,
      })),
    );
  }

  async update(id: number, scope: AccessScope, input: UpdateAttendanceInput) {
    const attendance = await this.attendanceRepository.findById(id, scope.establishmentId);

    if (!attendance) {
      throw new AppError("Attendance not found", 404, "ATTENDANCE_NOT_FOUND");
    }

    await this.ensureClassIsTaughtBy(attendance.classId, scope);

    return this.attendanceRepository.update(id, {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.justification !== undefined ? { justification: input.justification } : {}),
    });
  }

  async remove(id: number, scope: AccessScope) {
    const attendance = await this.attendanceRepository.findById(id, scope.establishmentId);

    if (!attendance) {
      throw new AppError("Attendance not found", 404, "ATTENDANCE_NOT_FOUND");
    }

    await this.ensureClassIsTaughtBy(attendance.classId, scope);

    return this.attendanceRepository.delete(id);
  }

  /**
   * L'enseignant fait l'appel dans ses seules classes. La vie scolaire
   * (surveillant général, direction) intervient sur toutes.
   */
  private async ensureClassIsTaughtBy(classId: number, scope: AccessScope) {
    const classEntity = await this.classRepository.findById(classId, scope.establishmentId);

    if (!classEntity) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    if (scope.teacherId === undefined) {
      if (!can(scope, "students.view.all")) {
        throw new AppError(
          "You are not allowed to record attendance for this class",
          403,
          "NOT_CLASS_TEACHER",
        );
      }

      return;
    }

    const teaches = await prisma.classSubject.findFirst({
      where: { classId, teacherId: scope.teacherId },
      select: { id: true },
    });

    if (!teaches) {
      throw new AppError(
        "You are not allowed to record attendance for this class",
        403,
        "NOT_CLASS_TEACHER",
      );
    }
  }

  private async ensureTimetableBelongsToClass(timetableId: number, classId: number) {
    const timetable = await prisma.timetable.findFirst({
      where: { id: timetableId, classSubject: { classId } },
      select: { id: true },
    });

    if (!timetable) {
      throw new AppError(
        "This timetable slot does not belong to this class",
        400,
        "TIMETABLE_CLASS_MISMATCH",
      );
    }
  }

  private async ensureStudentsInClass(
    studentIds: number[],
    classId: number,
    establishmentId: number,
  ) {
    const students = await this.studentRepository.findMany(establishmentId, {
      id: { in: studentIds },
      enrollments: { some: { classId } },
    });

    if (students.length !== new Set(studentIds).size) {
      throw new AppError("Some students are not enrolled in this class", 400, "STUDENT_NOT_IN_CLASS");
    }
  }
}
