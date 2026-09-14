import { prisma } from "../../infrastructure/database/prisma.js";

export class RoleRepository {
  findMany(establishmentId: number) {
    return prisma.role.findMany({
      where: { establishmentId },
      select: {
        id: true,
        name: true,
        description: true,
        rolePermissions: {
          select: { permission: { select: { code: true } } },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  findManyByIds(ids: number[], establishmentId: number) {
    return prisma.role.findMany({
      where: { id: { in: ids }, establishmentId },
      select: { id: true },
    });
  }
}
