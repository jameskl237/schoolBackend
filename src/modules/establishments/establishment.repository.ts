import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class EstablishmentRepository {
  findById(id: number) {
    return prisma.establishment.findUnique({
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true, students: true, classrooms: true, teachers: true } },
      },
      where: { id },
    });
  }

  update(id: number, data: Prisma.EstablishmentUpdateInput) {
    return prisma.establishment.update({
      where: { id },
      data,
      select: { id: true, name: true, code: true, type: true, createdAt: true, updatedAt: true },
    });
  }
}
