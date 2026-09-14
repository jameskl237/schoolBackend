import { prisma } from "../../infrastructure/database/prisma.js";

/** Flattens a user's roles -> role permissions into a deduplicated list of permission codes. */
export const getUserPermissions = async (userId: number): Promise<string[]> => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          rolePermissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      },
    },
  });

  const codes = new Set<string>();

  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      codes.add(rolePermission.permission.code);
    }
  }

  return [...codes];
};
