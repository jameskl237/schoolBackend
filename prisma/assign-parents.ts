import bcrypt from "bcrypt";

import type { Establishment } from "../src/generated/prisma/client.js";
import { ParentRelationType } from "../src/generated/prisma/enums.js";
import { prisma } from "../src/infrastructure/database/prisma.js";
import { DEFAULT_ACCOUNT_PASSWORD } from "../src/common/utils/account-provisioning.js";

/**
 * Garantit qu'un parent avec compte de connexion est rattaché à chaque élève,
 * afin de pouvoir tester l'espace parent de bout en bout.
 *
 * Idempotent : un élève (et un parent) déjà pourvu d'un compte est laissé intact.
 * Deux cas traités :
 *  - élève sans lien parent → création du parent avec compte + lien ;
 *  - élève dont aucun parent n'a de compte → le parent principal reçoit un compte.
 *
 * Lancement : npx tsx prisma/assign-parents.ts
 */

const DEMO_PASSWORD = DEFAULT_ACCOUNT_PASSWORD;

const parentRolePermissions = [
  "dashboard.view",
  "students.view",
  "timetables.view",
  "grades.view",
  "report-cards.view",
  "attendances.view",
  "disciplines.view",
  "transport.view",
];

const slug = (input: string) => input.toLowerCase().replace(/[^a-z0-9.]/g, "");

async function ensureParentRole(establishment: Establishment) {
  const existing = await prisma.role.findFirst({
    where: { establishmentId: establishment.id, name: "PARENT" },
  });

  if (existing) {
    const granted = await prisma.permission.findMany({
      where: {
        code: { in: parentRolePermissions },
        rolePermissions: { none: { roleId: existing.id } },
      },
      select: { id: true },
    });

    if (granted.length > 0) {
      await prisma.rolePermission.createMany({
        data: granted.map((permission) => ({ roleId: existing.id, permissionId: permission.id })),
      });
    }

    return existing;
  }

  const role = await prisma.role.create({
    data: {
      establishmentId: establishment.id,
      name: "PARENT",
      description: "Compte parent ou tuteur — consultation des données de ses enfants",
    },
  });

  const granted = await prisma.permission.findMany({
    where: { code: { in: parentRolePermissions } },
    select: { id: true },
  });

  if (granted.length > 0) {
    await prisma.rolePermission.createMany({
      data: granted.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
    });
  }

  return role;
}

async function assignParentPerEstablishment(establishment: Establishment) {
  const role = await ensureParentRole(establishment);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const students = await prisma.student.findMany({
    where: { establishmentId: establishment.id },
    include: {
      studentParents: {
        orderBy: { isPrimaryContact: "desc" },
        include: { parent: true },
      },
    },
  });

  let createdParents = 0;
  let upgradedParentAccounts = 0;

  for (const student of students) {
    const parents = student.studentParents.map((link) => link.parent);

    if (parents.length === 0) {
      const base = slug(`${student.lastName}.${student.firstName}.${student.studentNumber}`);
      const email = `${base}@${establishment.code.toLowerCase()}.demo`;

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: student.firstName,
          lastName: student.lastName,
          phone: null,
          establishment: { connect: { id: establishment.id } },
          role: { connect: { id: role.id } },
        },
      });

      const parent = await prisma.parent.create({
        data: {
          establishmentId: establishment.id,
          userId: user.id,
          firstName: student.firstName,
          lastName: student.lastName,
          address: student.address,
          email,
          studentParents: {
            create: { studentId: student.id, relationType: ParentRelationType.OTHER, isPrimaryContact: true },
          },
        },
      });

      // eslint-disable-next-line no-console
      console.log(`  + ${student.lastName} ${student.firstName} → parent #${parent.id} · ${email} / ${DEMO_PASSWORD}`);
      createdParents += 1;
      continue;
    }

    const linkedWithAccount = parents.find((parent) => parent.userId !== null);

    if (!linkedWithAccount) {
      const parent = parents[0];
      if (!parent) {
        continue;
      }

      const email =
        parent.email ??
        `${slug(`${parent.lastName}.${parent.firstName}.${student.studentNumber}`)}@${establishment.code.toLowerCase()}.demo`;

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: parent.firstName,
          lastName: parent.lastName,
          phone: parent.phone,
          establishment: { connect: { id: establishment.id } },
          role: { connect: { id: role.id } },
        },
      });

      await prisma.parent.update({
        where: { id: parent.id },
        data: { userId: user.id, email },
      });

      // eslint-disable-next-line no-console
      console.log(`  ^ ${parent.lastName} ${parent.firstName} (de ${student.lastName} ${student.firstName}) reçoit un compte · ${email} / ${DEMO_PASSWORD}`);
      upgradedParentAccounts += 1;
    }
  }

  return { createdParents, upgradedParentAccounts };
}

async function main() {
  const establishments = await prisma.establishment.findMany();

  if (establishments.length === 0) {
    // eslint-disable-next-line no-console
    console.log("Aucun établissement en base.");
    return;
  }

  for (const establishment of establishments) {
    // eslint-disable-next-line no-console
    console.log(`→ ${establishment.name} (${establishment.code})`);
    const { createdParents, upgradedParentAccounts } = await assignParentPerEstablishment(establishment);
    // eslint-disable-next-line no-console
    console.log(`  ${createdParents} parent(s) créé(s), ${upgradedParentAccounts} compte(s) attribué(s)`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });