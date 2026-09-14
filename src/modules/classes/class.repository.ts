import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const classInclude = {
  classroom: { select: { id: true, name: true, code: true } },
  mainTeacher: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
} satisfies Prisma.ClassInclude;

export class ClassRepository {
  findMany(establishmentId: number, gradeLevelId?: number) {
    return prisma.class.findMany({
      where: {
        gradeLevel: { cycle: { section: { schoolLevel: { establishmentId } } } },
        ...(gradeLevelId ? { gradeLevelId } : {}),
      },
      include: classInclude,
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.class.findFirst({
      where: { id, gradeLevel: { cycle: { section: { schoolLevel: { establishmentId } } } } },
      include: classInclude,
    });
  }

  create(data: Prisma.ClassCreateInput) {
    return prisma.class.create({ data, include: classInclude });
  }

  update(id: number, data: Prisma.ClassUpdateInput) {
    return prisma.class.update({ where: { id }, data, include: classInclude });
  }

  delete(id: number) {
    return prisma.class.delete({ where: { id } });
  }
}
