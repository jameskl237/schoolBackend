import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class FeeTypeRepository {
  findMany(establishmentId: number) {
    return prisma.feeType.findMany({
      where: { establishmentId },
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.feeType.findFirst({ where: { id, establishmentId } });
  }

  create(data: Prisma.FeeTypeCreateInput) {
    return prisma.feeType.create({ data });
  }

  update(id: number, data: Prisma.FeeTypeUpdateInput) {
    return prisma.feeType.update({ where: { id }, data });
  }

  delete(id: number) {
    return prisma.feeType.delete({ where: { id } });
  }
}
