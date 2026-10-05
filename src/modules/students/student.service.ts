import { AppError } from "../../common/errors/app-error.js";
import {
  DEFAULT_ACCOUNT_PASSWORD,
  provisionAccount,
  PROFILE_ROLES,
} from "../../common/utils/account-provisioning.js";
import { studentScopeFilter, type AccessScope } from "../../common/utils/access-scope.js";
import { hashPassword } from "../../common/utils/password.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { EnrollmentStatus, ParentRelationType } from "../../generated/prisma/enums.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";
import { ClassRepository } from "../classes/class.repository.js";
import { EnrollmentRepository } from "../enrollments/enrollment.repository.js";

import type {
  CreateParentWithStudentInput,
  CreateStudentInput,
  UpdateStudentEnrollmentInput,
  UpdateStudentInput,
} from "./student.dto.js";
import {
  StudentRepository,
  studentInclude,
  type StudentFilters,
  type StudentWithEnrollment,
} from "./student.repository.js";

/** Statuts qui rendent l'élève "inscrit" ; tous les autres le laissent "non inscrit". */
const ENROLLED_STATUSES: EnrollmentStatus[] = [EnrollmentStatus.ACTIVE, EnrollmentStatus.REPEATING];

/** Compte parent de consultation seule : ses enfants, leurs notes, bulletins, présences, transport. */
const PARENT_ROLE_PERMISSIONS = [
  "dashboard.view",
  "students.view",
  "timetables.view",
  "grades.view",
  "report-cards.view",
  "attendances.view",
  "disciplines.view",
  "transport.view",
];

const toStudentView = (student: StudentWithEnrollment) => {
  const { enrollments, studentParents, ...rest } = student;
  const currentEnrollment = enrollments[0] ?? null;
  const parents = studentParents.map(({ relationType, isPrimaryContact, parent }) => ({
    id: parent.id,
    firstName: parent.firstName,
    lastName: parent.lastName,
    phone: parent.phone,
    email: parent.email,
    userId: parent.userId,
    relationType,
    isPrimaryContact,
  }));

  return {
    ...rest,
    currentEnrollment,
    parents,
    isEnrolled: currentEnrollment ? ENROLLED_STATUSES.includes(currentEnrollment.status) : false,
  };
};

export class StudentService {
  constructor(
    private readonly studentRepository = new StudentRepository(),
    private readonly classRepository = new ClassRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
    private readonly enrollmentRepository = new EnrollmentRepository(),
  ) {}

  async list(scope: AccessScope, filters: StudentFilters = {}) {
    const students = await this.studentRepository.findMany(
      scope.establishmentId,
      studentScopeFilter(scope, filters.academicYearId),
      filters,
    );

    return students.map(toStudentView);
  }

  /** Hors périmètre, l'élève est introuvable : on ne révèle pas son existence. */
  async get(id: number, scope: AccessScope) {
    const student = await this.studentRepository.findById(
      id,
      scope.establishmentId,
      studentScopeFilter(scope),
    );

    if (!student) {
      throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    return toStudentView(student);
  }

  async create(scope: AccessScope, input: CreateStudentInput) {
    const { establishmentId } = scope;
    const { placeOfBirth, nationality, address, classId, academicYearId, parent, ...required } = input;

    await this.ensureClassExists(classId, establishmentId);
    const yearId = await this.resolveAcademicYearId(establishmentId, academicYearId);

    try {
      const created = await prisma.$transaction(async (tx) => {
        // Tout élève a son compte : c'est lui qui porte le rôle ELEVE et qui sert
        // d'ancrage s'il doit être son propre responsable.
        const account = await provisionAccount(tx, {
          establishmentId,
          roleName: PROFILE_ROLES.STUDENT,
          firstName: required.firstName,
          lastName: required.lastName,
          emailDomain: "eleve.local",
          defaultPassword: DEFAULT_ACCOUNT_PASSWORD,
        });

        const student = await tx.student.create({
          data: {
            ...required,
            ...(placeOfBirth !== undefined ? { placeOfBirth } : {}),
            ...(nationality !== undefined ? { nationality } : {}),
            ...(address !== undefined ? { address } : {}),
            establishment: { connect: { id: establishmentId } },
            user: { connect: { id: account.userId } },
            // Créé "non inscrit" : la scolarité confirmera l'inscription.
            enrollments: {
              create: {
                status: EnrollmentStatus.PENDING,
                class: { connect: { id: classId } },
                academicYear: { connect: { id: yearId } },
              },
            },
          },
          include: studentInclude,
        });

        const createdParent =
          parent !== undefined
            ? await this.createRecordedParent(tx, establishmentId, student.id, parent)
            : await this.createSelfParent(tx, establishmentId, student.id, account.userId, {
                firstName: required.firstName,
                lastName: required.lastName,
                ...(address !== undefined ? { address } : {}),
              });

        return { student, createdParent, account };
      });

      return {
        ...toStudentView(created.student),
        account: {
          loginEmail: created.account.loginEmail,
          password: created.account.password,
        },
        createdParent: created.createdParent,
      };
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  /** Parent renseigné par la scolarité : on crée son compte (rôle PARENT) et le lien élève-parent. */
  private async createRecordedParent(
    tx: Prisma.TransactionClient,
    establishmentId: number,
    studentId: number,
    input: CreateParentWithStudentInput,
  ) {
    const role = await this.ensureParentRole(tx, establishmentId);
    const loginEmail = input.email ?? this.buildParentEmail(input.lastName, input.firstName, establishmentId);
    const password = input.password ?? DEFAULT_ACCOUNT_PASSWORD;

    const user = await tx.user.create({
      data: {
        email: loginEmail,
        password: await hashPassword(password),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        establishment: { connect: { id: establishmentId } },
        role: { connect: { id: role.id } },
      },
    });

    const parent = await tx.parent.create({
      data: {
        establishmentId,
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        email: loginEmail,
        occupation: input.occupation ?? null,
        address: input.address ?? null,
        studentParents: {
          create: {
            studentId,
            relationType: input.relationType,
            isPrimaryContact: true,
          },
        },
      },
      include: {
        studentParents: {
          select: { relationType: true, isPrimaryContact: true },
        },
      },
    });

    return {
      id: parent.id,
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.email,
      loginEmail,
      password,
      isSelf: false,
    };
  }

  /**
   * Sans parent renseigné, l'élève est son propre responsable : le profil parent
   * est adossé à son propre compte, pas à un second compte fantôme.
   */
  private async createSelfParent(
    tx: Prisma.TransactionClient,
    establishmentId: number,
    studentId: number,
    userId: number,
    identity: { firstName: string; lastName: string; address?: string },
  ) {
    const parent = await tx.parent.create({
      data: {
        establishmentId,
        userId,
        firstName: identity.firstName,
        lastName: identity.lastName,
        address: identity.address ?? null,
        studentParents: {
          create: {
            studentId,
            relationType: ParentRelationType.SELF,
            isPrimaryContact: true,
          },
        },
      },
    });

    return {
      id: parent.id,
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: null,
      loginEmail: null,
      password: null,
      isSelf: true,
    };
  }

  /** Restitue le rôle PARENT de l'établissement, créé sur le tas s'il manque. */
  private async ensureParentRole(tx: Prisma.TransactionClient, establishmentId: number) {
    const existing = await tx.role.findFirst({
      where: { establishmentId, name: "PARENT" },
    });

    if (existing) {
      const granted = await tx.permission.findMany({
        where: {
          code: { in: PARENT_ROLE_PERMISSIONS },
          rolePermissions: { none: { roleId: existing.id } },
        },
        select: { id: true },
      });

      if (granted.length > 0) {
        await tx.rolePermission.createMany({
          data: granted.map((permission) => ({ roleId: existing.id, permissionId: permission.id })),
        });
      }

      return existing;
    }

    const role = await tx.role.create({
      data: {
        establishmentId,
        name: "PARENT",
        description: "Compte parent ou tuteur — consultation des données de ses enfants",
      },
    });

    const granted = await tx.permission.findMany({
      where: { code: { in: PARENT_ROLE_PERMISSIONS } },
      select: { id: true },
    });

    if (granted.length > 0) {
      await tx.rolePermission.createMany({
        data: granted.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      });
    }

    return role;
  }

  /** Adresse de connexion générée quand la scolarité ne fournit pas d'email parent. */
  private buildParentEmail(lastName: string, firstName: string, establishmentId: number) {
    const base = `${lastName}.${firstName}.${establishmentId}`.toLowerCase().replace(/[^a-z0-9.]/g, "");

    return `${base}@parent.local`;
  }

  async update(id: number, scope: AccessScope, input: UpdateStudentInput) {
    await this.get(id, scope);

    const { establishmentId } = scope;
    const { classId, ...fields } = input;

    if (classId !== undefined) {
      await this.ensureClassExists(classId, establishmentId);
      await this.moveToClass(id, establishmentId, classId);
    }

    try {
      const student = await this.studentRepository.update(id, stripUndefined(fields));

      return toStudentView(student);
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  /** Inscription (ou changement de statut) de l'élève par la scolarité. */
  async updateEnrollmentStatus(
    id: number,
    scope: AccessScope,
    input: UpdateStudentEnrollmentInput,
  ) {
    await this.get(id, scope);

    const { establishmentId } = scope;

    const enrollment = await this.enrollmentRepository.findLatestByStudent(id);

    if (!enrollment) {
      throw new AppError(
        "This student has no enrollment to update",
        404,
        "ENROLLMENT_NOT_FOUND",
      );
    }

    if (input.classId !== undefined) {
      await this.ensureClassExists(input.classId, establishmentId);
    }

    await this.enrollmentRepository.update(enrollment.id, {
      status: input.status,
      ...(input.classId !== undefined ? { class: { connect: { id: input.classId } } } : {}),
    });

    return this.get(id, scope);
  }

  async remove(id: number, scope: AccessScope) {
    await this.get(id, scope);

    return this.studentRepository.delete(id);
  }

  private async ensureClassExists(classId: number, establishmentId: number) {
    const classEntity = await this.classRepository.findById(classId, establishmentId);

    if (!classEntity) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }
  }

  private async resolveAcademicYearId(establishmentId: number, academicYearId?: number) {
    if (academicYearId !== undefined) {
      const academicYear = await this.academicYearRepository.findById(
        academicYearId,
        establishmentId,
      );

      if (!academicYear) {
        throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
      }

      return academicYear.id;
    }

    const currentYear = await this.academicYearRepository.findCurrent(establishmentId);

    if (!currentYear) {
      throw new AppError(
        "No current academic year is defined for this establishment",
        409,
        "NO_CURRENT_ACADEMIC_YEAR",
      );
    }

    return currentYear.id;
  }

  /** Réaffecte l'élève sur son inscription courante, sans toucher au statut. */
  private async moveToClass(studentId: number, establishmentId: number, classId: number) {
    const enrollment = await this.enrollmentRepository.findLatestByStudent(studentId);

    if (enrollment) {
      if (enrollment.classId !== classId) {
        await this.enrollmentRepository.update(enrollment.id, {
          class: { connect: { id: classId } },
        });
      }

      return;
    }

    // Élève antérieur à cette règle : on lui crée son inscription initiale.
    const yearId = await this.resolveAcademicYearId(establishmentId);

    await this.enrollmentRepository.create({
      status: EnrollmentStatus.PENDING,
      student: { connect: { id: studentId } },
      class: { connect: { id: classId } },
      academicYear: { connect: { id: yearId } },
    });
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "A student with this student number already exists",
        409,
        "STUDENT_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
