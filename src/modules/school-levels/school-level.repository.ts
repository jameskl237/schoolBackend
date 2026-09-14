import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class SchoolLevelRepository {
  findMany(establishmentId: number) {
    return prisma.schoolLevel.findMany({
      where: { establishmentId },
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.schoolLevel.findFirst({ where: { id, establishmentId } });
  }

  create(data: Prisma.SchoolLevelCreateInput) {
    return prisma.schoolLevel.create({ data });
  }

  update(id: number, data: Prisma.SchoolLevelUpdateInput) {
    return prisma.schoolLevel.update({ where: { id }, data });
  }

  delete(id: number) {
    return prisma.schoolLevel.delete({ where: { id } });
  }
}
