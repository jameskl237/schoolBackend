import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const periodInclude = {
  academicYear: { select: { id: true, name: true, isCurrent: true } },
} satisfies Prisma.PeriodInclude;

export class PeriodRepository {
  findMany(establishmentId: number, academicYearId?: number) {
    return prisma.period.findMany({
      where: {
        academicYear: { establishmentId },
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: periodInclude,
      orderBy: [{ academicYearId: "desc" }, { order: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.period.findFirst({
      where: { id, academicYear: { establishmentId } },
      include: periodInclude,
    });
  }

  create(data: Prisma.PeriodCreateInput) {
    return prisma.period.create({ data, include: periodInclude });
  }

  update(id: number, data: Prisma.PeriodUpdateInput) {
    return prisma.period.update({ where: { id }, data, include: periodInclude });
  }

  delete(id: number) {
    return prisma.period.delete({ where: { id } });
  }
}
