import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const classroomInclude = {
  class: { select: { id: true, name: true, code: true } },
} satisfies Prisma.ClassroomInclude;

export class ClassroomRepository {
  findMany(establishmentId: number, options: { onlyAvailable?: boolean } = {}) {
    return prisma.classroom.findMany({
      where: {
        establishmentId,
        ...(options.onlyAvailable ? { class: null } : {}),
      },
      include: classroomInclude,
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.classroom.findFirst({
      where: { id, establishmentId },
      include: classroomInclude,
    });
  }

  create(data: Prisma.ClassroomCreateInput) {
    return prisma.classroom.create({ data, include: classroomInclude });
  }

  update(id: number, data: Prisma.ClassroomUpdateInput) {
    return prisma.classroom.update({ where: { id }, data, include: classroomInclude });
  }

  delete(id: number) {
    return prisma.classroom.delete({ where: { id } });
  }
}
