import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";
import { ClassRepository } from "../classes/class.repository.js";
import { SubjectRepository } from "../subjects/subject.repository.js";
import { TeacherRepository } from "../teachers/teacher.repository.js";

import type { CreateClassSubjectInput, UpdateClassSubjectInput } from "./class-subject.dto.js";
import {
  ClassSubjectRepository,
  type ClassSubjectFilters,
} from "./class-subject.repository.js";

export class ClassSubjectService {
  constructor(
    private readonly classSubjectRepository = new ClassSubjectRepository(),
    private readonly classRepository = new ClassRepository(),
    private readonly subjectRepository = new SubjectRepository(),
    private readonly teacherRepository = new TeacherRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
  ) {}

  /** Un enseignant ne voit que ses propres affectations, quels que soient les filtres demandés. */
  list(scope: AccessScope, filters: ClassSubjectFilters) {
    if (this.hasGlobalView(scope)) {
      return this.classSubjectRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.teacherId === undefined) {
      return Promise.resolve([]);
    }

    return this.classSubjectRepository.findMany(scope.establishmentId, {
      ...filters,
      teacherId: scope.teacherId,
    });
  }

  private hasGlobalView(scope: AccessScope) {
    if (can(scope, "class-subjects.manage", "timetables.manage")) {
      return true;
    }

    // La vie scolaire a besoin de toutes les classes pour faire l'appel, mais un
    // enseignant qui porte la même permission reste borné à ses affectations.
    return scope.teacherId === undefined && can(scope, "attendances.manage");
  }

  async get(id: number, scope: AccessScope) {
    const classSubject = await this.classSubjectRepository.findById(id, scope.establishmentId);

    if (!classSubject) {
      throw new AppError("Class subject not found", 404, "CLASS_SUBJECT_NOT_FOUND");
    }

    const isOwner = scope.teacherId !== undefined && classSubject.teacherId === scope.teacherId;

    if (!isOwner && !this.hasGlobalView(scope)) {
      throw new AppError("Class subject not found", 404, "CLASS_SUBJECT_NOT_FOUND");
    }

    return classSubject;
  }

  async create(establishmentId: number, input: CreateClassSubjectInput) {
    const { classId, subjectId, teacherId, academicYearId, ...rest } = input;

    await this.ensureReferences(establishmentId, { classId, subjectId, teacherId, academicYearId });

    try {
      return await this.classSubjectRepository.create({
        ...stripUndefined(rest),
        class: { connect: { id: classId } },
        subject: { connect: { id: subjectId } },
        teacher: { connect: { id: teacherId } },
        academicYear: { connect: { id: academicYearId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, scope: AccessScope, input: UpdateClassSubjectInput) {
    await this.get(id, scope);

    const { teacherId, ...rest } = input;

    if (teacherId !== undefined) {
      await this.ensureReferences(scope.establishmentId, { teacherId });
    }

    try {
      return await this.classSubjectRepository.update(id, {
        ...stripUndefined(rest),
        ...(teacherId !== undefined ? { teacher: { connect: { id: teacherId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async remove(id: number, scope: AccessScope) {
    await this.get(id, scope);

    return this.classSubjectRepository.delete(id);
  }

  private async ensureReferences(
    establishmentId: number,
    refs: { classId?: number; subjectId?: number; teacherId?: number; academicYearId?: number },
  ) {
    if (refs.classId !== undefined && !(await this.classRepository.findById(refs.classId, establishmentId))) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    if (
      refs.subjectId !== undefined &&
      !(await this.subjectRepository.findById(refs.subjectId, establishmentId))
    ) {
      throw new AppError("Subject not found", 404, "SUBJECT_NOT_FOUND");
    }

    if (
      refs.teacherId !== undefined &&
      !(await this.teacherRepository.findById(refs.teacherId, establishmentId))
    ) {
      throw new AppError("Teacher not found", 404, "TEACHER_NOT_FOUND");
    }

    if (
      refs.academicYearId !== undefined &&
      !(await this.academicYearRepository.findById(refs.academicYearId, establishmentId))
    ) {
      throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
    }
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "This subject is already assigned to this class for this academic year",
        409,
        "CLASS_SUBJECT_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
