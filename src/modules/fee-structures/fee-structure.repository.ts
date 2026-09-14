import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const feeStructureInclude = {
  feeType: { select: { id: true, name: true } },
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true, code: true } },
} satisfies Prisma.FeeStructureInclude;

export class FeeStructureRepository {
  findMany(establishmentId: number, academicYearId?: number) {
    return prisma.feeStructure.findMany({
      where: {
        feeType: { establishmentId },
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: feeStructureInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.feeStructure.findFirst({
      where: { id, feeType: { establishmentId } },
      include: feeStructureInclude,
    });
  }

  create(data: Prisma.FeeStructureCreateInput) {
    return prisma.feeStructure.create({ data, include: feeStructureInclude });
  }

  update(id: number, data: Prisma.FeeStructureUpdateInput) {
    return prisma.feeStructure.update({ where: { id }, data, include: feeStructureInclude });
  }

  delete(id: number) {
    return prisma.feeStructure.delete({ where: { id } });
  }
}
