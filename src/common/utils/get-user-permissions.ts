import { prisma } from "../../infrastructure/database/prisma.js";

/** Les codes de permission portés par le rôle unique du compte. */
export const getUserPermissions = async (userId: number): Promise<string[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  return (user?.role.rolePermissions ?? []).map(
    (rolePermission) => rolePermission.permission.code,
  );
};
