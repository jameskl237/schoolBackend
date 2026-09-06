import { prisma } from "../../src/infrastructure/database/prisma.js";

import { permissions } from "./definitions.js";

export async function seedPermissions() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        ...(permission.description !== undefined
          ? { description: permission.description }
          : {}),
      },
      create: permission,
    });
  }
}