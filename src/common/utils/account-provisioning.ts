import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

import { hashPassword } from "./password.js";

type Client = Prisma.TransactionClient | typeof prisma;

/**
 * Mot de passe initial de tout compte ouvert par l'établissement, quel que soit
 * le profil. Une valeur unique, et une seule : des valeurs par type finissaient
 * par diverger et rendaient les comptes inutilisables faute de savoir laquelle
 * s'appliquait. Il reste à forcer son changement à la première connexion.
 */
export const DEFAULT_ACCOUNT_PASSWORD = "Password123!";

/**
 * Chaque type de profil correspond à un rôle : c'est le rôle du compte qui dit
 * ce qu'est la personne dans l'application et ce qu'elle a le droit de faire.
 */
export const PROFILE_ROLES = {
  TEACHER: "ENSEIGNANT",
  STUDENT: "ELEVE",
  PARENT: "PARENT",
  GUARDIAN: "PARENT",
} as const;

/** Permissions minimales d'un compte de consultation (parent, tuteur, élève). */
const VIEWER_PERMISSIONS = [
  "dashboard.view",
  "students.view",
  "timetables.view",
  "grades.view",
  "report-cards.view",
  "attendances.view",
  "transport.view",
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ENSEIGNANT: "Enseignant chargé de matière",
  ELEVE: "Compte élève — consultation de ses seules données",
  PARENT: "Compte parent ou tuteur — consultation des données de ses enfants",
};

/**
 * Restitue le rôle demandé pour l'établissement, créé sur le tas s'il manque —
 * un profil ne doit jamais échouer faute de rôle déclaré.
 */
export const ensureRole = async (tx: Client, establishmentId: number, name: string) => {
  const existing = await tx.role.findFirst({ where: { establishmentId, name } });

  if (existing) {
    return existing;
  }

  const role = await tx.role.create({
    data: {
      establishmentId,
      name,
      ...(ROLE_DESCRIPTIONS[name] !== undefined
        ? { description: ROLE_DESCRIPTIONS[name] }
        : {}),
    },
  });

  const granted = await tx.permission.findMany({
    where: { code: { in: VIEWER_PERMISSIONS } },
    select: { id: true },
  });

  if (granted.length > 0) {
    await tx.rolePermission.createMany({
      data: granted.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
    });
  }

  return role;
};

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Adresse de connexion générée quand aucune n'est fournie.
 *
 * L'unicité est vérifiée sur l'ensemble des établissements, et non seulement
 * dans le sien : c'est ce qui permet de se connecter avec la seule adresse,
 * sans avoir à saisir le code de son école.
 */
export const buildLoginEmail = async (
  tx: Client,
  firstName: string,
  lastName: string,
  domain: string,
): Promise<string> => {
  const base = `${slug(lastName)}.${slug(firstName)}`;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const email = attempt === 0 ? `${base}@${domain}` : `${base}${attempt + 1}@${domain}`;
    const taken = await tx.user.findFirst({ where: { email }, select: { id: true } });

    if (!taken) {
      return email;
    }
  }

  return `${base}.${Date.now()}@${domain}`;
};

export interface ProvisionAccountInput {
  establishmentId: number;
  roleName: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | undefined;
  password?: string | undefined;
  /** Domaine des adresses générées, ex. "parent.local". */
  emailDomain: string;
  defaultPassword: string;
}

export interface ProvisionedAccount {
  userId: number;
  loginEmail: string;
  /** Mot de passe en clair, à remettre à la personne : il n'est plus lisible ensuite. */
  password: string;
}

/** Crée le compte de connexion d'un profil, avec le rôle correspondant à son type. */
export const provisionAccount = async (
  tx: Client,
  input: ProvisionAccountInput,
): Promise<ProvisionedAccount> => {
  const role = await ensureRole(tx, input.establishmentId, input.roleName);
  const loginEmail =
    input.email ??
    (await buildLoginEmail(tx, input.firstName, input.lastName, input.emailDomain));
  const password = input.password ?? input.defaultPassword;

  const user = await tx.user.create({
    data: {
      email: loginEmail,
      password: await hashPassword(password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      establishment: { connect: { id: input.establishmentId } },
      role: { connect: { id: role.id } },
    },
    select: { id: true },
  });

  return { userId: user.id, loginEmail, password };
};
