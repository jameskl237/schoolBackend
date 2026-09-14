import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class SectionRepository {
  findMany(establishmentId: number, schoolLevelId?: number) {
    return prisma.section.findMany({
      where: {
        schoolLevel: { establishmentId },
        ...(schoolLevelId ? { schoolLevelId } : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.section.findFirst({ where: { id, schoolLevel: { establishmentId } } });
  }

  create(data: Prisma.SectionCreateInput) {
    return prisma.section.create({ data });
  }

  update(id: number, data: Prisma.SectionUpdateInput) {
    return prisma.section.update({ where: { id }, data });
  }

  delete(id: number) {
    return prisma.section.delete({ where: { id } });
  }
}
