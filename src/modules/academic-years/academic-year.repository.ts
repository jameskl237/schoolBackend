import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class AcademicYearRepository {
  findMany(establishmentId: number) {
    return prisma.academicYear.findMany({
      where: { establishmentId },
      orderBy: { startDate: "desc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.academicYear.findFirst({ where: { id, establishmentId } });
  }

  findCurrent(establishmentId: number) {
    return prisma.academicYear.findFirst({ where: { establishmentId, isCurrent: true } });
  }

  create(data: Prisma.AcademicYearCreateInput) {
    return prisma.academicYear.create({ data });
  }

  update(id: number, data: Prisma.AcademicYearUpdateInput) {
    return prisma.academicYear.update({ where: { id }, data });
  }

  delete(id: number) {
    return prisma.academicYear.delete({ where: { id } });
  }

  /** Only one academic year may be "current" per establishment. */
  unsetCurrentExcept(establishmentId: number, exceptId?: number) {
    return prisma.academicYear.updateMany({
      where: {
        establishmentId,
        isCurrent: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isCurrent: false },
    });
  }
}
