import {
  PROFILE_ROLES,
  provisionAccount,
} from "../src/common/utils/account-provisioning.js";
import { prisma } from "../src/infrastructure/database/prisma.js";

/**
 * Reprise des profils antérieurs au modèle « un compte par personne ».
 *
 * Chaque enseignant, élève, parent ou tuteur sans compte en reçoit un, avec le
 * rôle de son type. Le script est rejouable : il ne touche que les profils dont
 * `userId` est nul, et n'efface jamais rien.
 */

interface Target {
  label: string;
  roleName: string;
  emailDomain: string;
  defaultPassword: string;
  load: () => Promise<
    { id: number; establishmentId: number; firstName: string; lastName: string; phone?: string | null; email?: string | null }[]
  >;
  attach: (id: number, userId: number) => Promise<unknown>;
}

const targets: Target[] = [
  {
    label: "Enseignants",
    roleName: PROFILE_ROLES.TEACHER,
    emailDomain: "enseignant.local",
    defaultPassword: "Prof@123",
    load: () =>
      prisma.teacher.findMany({
        where: { userId: null },
        select: { id: true, establishmentId: true, firstName: true, lastName: true, phone: true, email: true },
      }),
    attach: (id, userId) => prisma.teacher.update({ where: { id }, data: { userId } }),
  },
  {
    label: "Élèves",
    roleName: PROFILE_ROLES.STUDENT,
    emailDomain: "eleve.local",
    defaultPassword: "Eleve@123",
    load: () =>
      prisma.student.findMany({
        where: { userId: null },
        select: { id: true, establishmentId: true, firstName: true, lastName: true },
      }),
    attach: (id, userId) => prisma.student.update({ where: { id }, data: { userId } }),
  },
  {
    label: "Parents",
    roleName: PROFILE_ROLES.PARENT,
    emailDomain: "parent.local",
    defaultPassword: "Parent@123",
    load: () =>
      prisma.parent.findMany({
        where: { userId: null },
        select: { id: true, establishmentId: true, firstName: true, lastName: true, phone: true, email: true },
      }),
    attach: (id, userId) => prisma.parent.update({ where: { id }, data: { userId } }),
  },
  {
    label: "Tuteurs",
    roleName: PROFILE_ROLES.GUARDIAN,
    emailDomain: "tuteur.local",
    defaultPassword: "Tuteur@123",
    load: () =>
      prisma.guardian.findMany({
        where: { userId: null },
        select: { id: true, establishmentId: true, firstName: true, lastName: true, phone: true, email: true },
      }),
    attach: (id, userId) => prisma.guardian.update({ where: { id }, data: { userId } }),
  },
];

async function main() {
  for (const target of targets) {
    const profiles = await target.load();

    if (profiles.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`→ ${target.label} : rien à reprendre.`);
      continue;
    }

    let created = 0;

    for (const profile of profiles) {
      // L'adresse déclarée sur la fiche sert d'identifiant si elle est libre ;
      // sinon une adresse est générée, pour ne bloquer aucune reprise.
      const declared = profile.email ?? undefined;
      const taken =
        declared !== undefined
          ? await prisma.user.findFirst({
              where: { establishmentId: profile.establishmentId, email: declared },
              select: { id: true },
            })
          : null;

      const account = await provisionAccount(prisma, {
        establishmentId: profile.establishmentId,
        roleName: target.roleName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? null,
        ...(declared !== undefined && taken === null ? { email: declared } : {}),
        emailDomain: target.emailDomain,
        defaultPassword: target.defaultPassword,
      });

      await target.attach(profile.id, account.userId);
      created += 1;
    }

    // eslint-disable-next-line no-console
    console.log(`→ ${target.label} : ${created} compte(s) créé(s).`);
  }
}

main()
  .then(async () => {
    // eslint-disable-next-line no-console
    console.log("✅ Reprise terminée : plus aucun profil sans compte.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
