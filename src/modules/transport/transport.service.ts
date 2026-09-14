import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";
import { StudentRepository } from "../students/student.repository.js";

import type {
  CreateRouteInput,
  CreateSubscriptionInput,
  UpdateRouteInput,
  UpdateSubscriptionInput,
} from "./transport.dto.js";
import {
  TransportRouteRepository,
  TransportSubscriptionRepository,
  type SubscriptionFilters,
} from "./transport.repository.js";

export class TransportService {
  constructor(
    private readonly routeRepository = new TransportRouteRepository(),
    private readonly subscriptionRepository = new TransportSubscriptionRepository(),
    private readonly studentRepository = new StudentRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
  ) {}

  listRoutes(establishmentId: number) {
    return this.routeRepository.findMany(establishmentId);
  }

  async getRoute(id: number, establishmentId: number) {
    const route = await this.routeRepository.findById(id, establishmentId);

    if (!route) {
      throw new AppError("Transport route not found", 404, "TRANSPORT_ROUTE_NOT_FOUND");
    }

    return route;
  }

  async createRoute(establishmentId: number, input: CreateRouteInput) {
    const { feeTypeId, description, ...required } = input;

    if (feeTypeId !== undefined) {
      await this.ensureFeeTypeExists(feeTypeId, establishmentId);
    }

    try {
      return await this.routeRepository.create({
        ...required,
        ...(description !== undefined ? { description } : {}),
        establishment: { connect: { id: establishmentId } },
        ...(feeTypeId !== undefined ? { feeType: { connect: { id: feeTypeId } } } : {}),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async updateRoute(id: number, establishmentId: number, input: UpdateRouteInput) {
    await this.getRoute(id, establishmentId);

    const { feeTypeId, ...rest } = input;

    if (typeof feeTypeId === "number") {
      await this.ensureFeeTypeExists(feeTypeId, establishmentId);
    }

    try {
      return await this.routeRepository.update(id, {
        ...stripUndefined(rest),
        ...(feeTypeId === undefined
          ? {}
          : feeTypeId === null
            ? { feeType: { disconnect: true } }
            : { feeType: { connect: { id: feeTypeId } } }),
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async removeRoute(id: number, establishmentId: number) {
    await this.getRoute(id, establishmentId);

    return this.routeRepository.delete(id);
  }

  /** L'élève ne consulte que son propre abonnement ; la gestion voit tout. */
  listSubscriptions(scope: AccessScope, filters: SubscriptionFilters) {
    if (can(scope, "transport.manage", "students.view.all")) {
      return this.subscriptionRepository.findMany(scope.establishmentId, filters);
    }

    if (scope.studentId !== undefined) {
      return this.subscriptionRepository.findMany(scope.establishmentId, {
        ...filters,
        studentId: scope.studentId,
      });
    }

    return Promise.resolve([]);
  }

  async getSubscription(id: number, scope: AccessScope) {
    const subscription = await this.subscriptionRepository.findById(id, scope.establishmentId);

    const isVisible =
      subscription !== null &&
      (can(scope, "transport.manage", "students.view.all") ||
        subscription.studentId === scope.studentId);

    if (!isVisible) {
      throw new AppError("Transport subscription not found", 404, "TRANSPORT_SUBSCRIPTION_NOT_FOUND");
    }

    return subscription;
  }

  async createSubscription(establishmentId: number, input: CreateSubscriptionInput) {
    const { studentId, routeId, academicYearId, startDate, pickupPoint, status } = input;

    await this.ensureStudentExists(studentId, establishmentId);
    await this.getRoute(routeId, establishmentId);

    const yearId = await this.resolveAcademicYearId(establishmentId, academicYearId);

    try {
      return await this.subscriptionRepository.create({
        ...(status !== undefined ? { status } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(pickupPoint !== undefined ? { pickupPoint } : {}),
        student: { connect: { id: studentId } },
        route: { connect: { id: routeId } },
        academicYear: { connect: { id: yearId } },
      });
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async updateSubscription(id: number, scope: AccessScope, input: UpdateSubscriptionInput) {
    await this.getSubscription(id, scope);

    const { routeId, ...rest } = input;

    if (routeId !== undefined) {
      await this.getRoute(routeId, scope.establishmentId);
    }

    return this.subscriptionRepository.update(id, {
      ...stripUndefined(rest),
      ...(routeId !== undefined ? { route: { connect: { id: routeId } } } : {}),
    });
  }

  async removeSubscription(id: number, scope: AccessScope) {
    await this.getSubscription(id, scope);

    return this.subscriptionRepository.delete(id);
  }

  private async ensureStudentExists(studentId: number, establishmentId: number) {
    if (!(await this.studentRepository.findById(studentId, establishmentId))) {
      throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }
  }

  private async ensureFeeTypeExists(feeTypeId: number, establishmentId: number) {
    const feeType = await prisma.feeType.findFirst({ where: { id: feeTypeId, establishmentId } });

    if (!feeType) {
      throw new AppError("Fee type not found", 404, "FEE_TYPE_NOT_FOUND");
    }
  }

  private async resolveAcademicYearId(establishmentId: number, academicYearId?: number) {
    if (academicYearId !== undefined) {
      if (!(await this.academicYearRepository.findById(academicYearId, establishmentId))) {
        throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
      }

      return academicYearId;
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

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError(
        "This code or subscription already exists for this academic year",
        409,
        "TRANSPORT_ALREADY_EXISTS",
      );
    }

    return error;
  }
}
