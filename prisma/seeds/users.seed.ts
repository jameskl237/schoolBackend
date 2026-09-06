import bcrypt from "bcrypt";

import type { Establishment } from "../../src/generated/prisma/client.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

import { getRolesForType } from "./definitions.js";

const DEMO_PASSWORD = "Password123!";

const slugify = (name: string) => name.toLowerCase().replaceAll("_", "-");

export async function seedUsers(establishments: Establishment[]) {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const establishment of establishments) {
    const roles = getRolesForType(establishment.type);

    const existingRoles = await prisma.role.findMany({
      where: { establishmentId: establishment.id },
      include: { userRoles: true },
    });

    for (const role of roles) {
      const roleRecord = existingRoles.find((r) => r.name === role.name);

      if (!roleRecord) {
        continue;
      }

      for (let index = 1; index <= 2; index += 1) {
        const slug = slugify(role.name);
        const email = `${slug}.${index}@${establishment.code.toLowerCase()}.demo`;

        const seededUser = await prisma.user.upsert({
          where: {
            establishmentId_email: {
              establishmentId: establishment.id,
              email,
            },
          },
          update: {},
          create: {
            email,
            password: hashedPassword,
            firstName: `Démo ${index}`,
            lastName: roleRecord.name,
            establishment: {
              connect: { id: establishment.id },
            },
          },
        });

        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: seededUser.id,
              roleId: roleRecord.id,
            },
          },
          update: {},
          create: {
            userId: seededUser.id,
            roleId: roleRecord.id,
          },
        });
      }
    }
  }
}