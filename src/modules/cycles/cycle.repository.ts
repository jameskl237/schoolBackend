import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class CycleRepository {
  findMany(establishmentId: number, sectionId?: number) {
    return prisma.cycle.findMany({
      where: {
        section: { schoolLevel: { establishmentId } },
        ...(sectionId ? { sectionId } : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.cycle.findFirst({
      where: { id, section: { schoolLevel: { establishmentId } } },
    });
  }

  create(data: Prisma.CycleCreateInput) {
    return prisma.cycle.create({ data });
  }

  update(id: number, data: Prisma.CycleUpdateInput) {
    return prisma.cycle.update({ where: { id }, data });
  }

  delete(id: number) {
    return prisma.cycle.delete({ where: { id } });
  }
}
