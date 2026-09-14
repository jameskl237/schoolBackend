import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const routeInclude = {
  feeType: { select: { id: true, name: true } },
  _count: { select: { subscriptions: true } },
} satisfies Prisma.TransportRouteInclude;

const subscriptionInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  route: { select: { id: true, name: true, code: true, fee: true } },
  academicYear: { select: { id: true, name: true, isCurrent: true } },
} satisfies Prisma.TransportSubscriptionInclude;

export interface SubscriptionFilters {
  studentId?: number;
  routeId?: number;
  academicYearId?: number;
}

export class TransportRouteRepository {
  findMany(establishmentId: number) {
    return prisma.transportRoute.findMany({
      where: { establishmentId },
      include: routeInclude,
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.transportRoute.findFirst({ where: { id, establishmentId }, include: routeInclude });
  }

  create(data: Prisma.TransportRouteCreateInput) {
    return prisma.transportRoute.create({ data, include: routeInclude });
  }

  update(id: number, data: Prisma.TransportRouteUpdateInput) {
    return prisma.transportRoute.update({ where: { id }, data, include: routeInclude });
  }

  delete(id: number) {
    return prisma.transportRoute.delete({ where: { id } });
  }
}

export class TransportSubscriptionRepository {
  findMany(establishmentId: number, filters: SubscriptionFilters = {}) {
    return prisma.transportSubscription.findMany({
      where: {
        student: { establishmentId },
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.routeId ? { routeId: filters.routeId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: subscriptionInclude,
      orderBy: [{ academicYearId: "desc" }, { studentId: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.transportSubscription.findFirst({
      where: { id, student: { establishmentId } },
      include: subscriptionInclude,
    });
  }

  create(data: Prisma.TransportSubscriptionCreateInput) {
    return prisma.transportSubscription.create({ data, include: subscriptionInclude });
  }

  update(id: number, data: Prisma.TransportSubscriptionUpdateInput) {
    return prisma.transportSubscription.update({ where: { id }, data, include: subscriptionInclude });
  }

  delete(id: number) {
    return prisma.transportSubscription.delete({ where: { id } });
  }
}
