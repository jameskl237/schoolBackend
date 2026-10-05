import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const roleSelect = {
  id: true,
  name: true,
  description: true,
  rolePermissions: { select: { permission: { select: { code: true } } } },
  _count: { select: { users: true } },
} satisfies Prisma.RoleSelect;

export class RoleRepository {
  findMany(establishmentId: number) {
    return prisma.role.findMany({
      where: { establishmentId },
      select: roleSelect,
      orderBy: { name: "asc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.role.findFirst({ where: { id, establishmentId }, select: roleSelect });
  }

  findManyByIds(ids: number[], establishmentId: number) {
    return prisma.role.findMany({
      where: { id: { in: ids }, establishmentId },
      select: { id: true },
    });
  }

  create(data: Prisma.RoleUncheckedCreateInput) {
    return prisma.role.create({ data, select: roleSelect });
  }

  update(id: number, data: Prisma.RoleUpdateInput) {
    return prisma.role.update({ where: { id }, data, select: roleSelect });
  }

  delete(id: number) {
    return prisma.role.delete({ where: { id } });
  }

  listPermissions() {
    return prisma.permission.findMany({
      select: { id: true, code: true, name: true, description: true },
      orderBy: { code: "asc" },
    });
  }

  /** Aligne les permissions du rôle sur la liste fournie, en une transaction. */
  setPermissions(roleId: number, permissionIds: number[]) {
    return prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId, permissionId: { notIn: permissionIds.length > 0 ? permissionIds : [-1] } },
      });

      for (const permissionId of permissionIds) {
        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        });
      }

      return tx.role.findUnique({ where: { id: roleId }, select: roleSelect });
    });
  }
}
