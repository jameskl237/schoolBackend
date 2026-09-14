import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class GradeLevelRepository {
  findMany(establishmentId: number, cycleId?: number) {
    return prisma.gradeLevel.findMany({
      where: {
        cycle: { section: { schoolLevel: { establishmentId } } },
        ...(cycleId ? { cycleId } : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.gradeLevel.findFirst({
      where: { id, cycle: { section: { schoolLevel: { establishmentId } } } },
    });
  }

  create(data: Prisma.GradeLevelCreateInput) {
    return prisma.gradeLevel.create({ data });
  }

  update(id: number, data: Prisma.GradeLevelUpdateInput) {
    return prisma.gradeLevel.update({ where: { id }, data });
  }

  delete(id: number) {
    return prisma.gradeLevel.delete({ where: { id } });
  }
}
