import type { Establishment } from "../../src/generated/prisma/client.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

import { getRolesForType } from "./definitions.js";

export async function seedRoles(establishments: Establishment[]) {
  for (const establishment of establishments) {
    const roles = getRolesForType(establishment.type);

    for (const role of roles) {
      const seededRole = await prisma.role.upsert({
        where: {
          establishmentId_name: {
            establishmentId: establishment.id,
            name: role.name,
          },
        },
        update: {
          ...(role.description !== undefined ? { description: role.description } : {}),
        },
        create: {
          name: role.name,
          ...(role.description !== undefined ? { description: role.description } : {}),
          establishment: {
            connect: { id: establishment.id },
          },
        },
      });

      const granted = await prisma.permission.findMany({
        where: { code: { in: role.permissions } },
        select: { id: true },
      });

      for (const permission of granted) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: seededRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: seededRole.id,
            permissionId: permission.id,
          },
        });
      }

      // Le seed fait converger la base vers la définition : ce qui a été retiré
      // d'un rôle doit lui être révoqué, pas seulement absent des nouveaux octrois.
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: seededRole.id,
          permissionId: { notIn: granted.map((permission) => permission.id) },
        },
      });
    }
  }
}