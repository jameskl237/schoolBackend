import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  isActive: true,
  establishmentId: true,
  createdAt: true,
  updatedAt: true,
  roleId: true,
  role: { select: { id: true, name: true, description: true } },
} satisfies Prisma.UserSelect;

export class UserRepository {
  findMany(establishmentId: number) {
    return prisma.user.findMany({
      where: { establishmentId },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.user.findFirst({
      where: { id, establishmentId },
      select: userSelect,
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, select: userSelect });
  }

  update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  delete(id: number) {
    return prisma.user.delete({ where: { id } });
  }
}
