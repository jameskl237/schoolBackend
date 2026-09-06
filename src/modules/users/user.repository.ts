import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class UserRepository {
  findMany(establishmentId: number) {
    return prisma.user.findMany({
      where: { establishmentId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        establishmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.user.findFirst({
      where: { id, establishmentId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        establishmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  delete(id: number) {
    return prisma.user.delete({ where: { id } });
  }
}
