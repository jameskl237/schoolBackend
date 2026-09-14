import bcrypt from "bcrypt";

import type { Establishment } from "../../src/generated/prisma/client.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

import { getRolesForType } from "./definitions.js";

const DEMO_PASSWORD = "Password123!";

const slugify = (name: string) => name.toLowerCase().replaceAll("_", "-");

// Prénoms/noms courants au Cameroun, pour des tuples de démo réalistes.
const FIRST_NAMES = [
  "Jean",
  "Marie",
  "Paul",
  "Christelle",
  "Emmanuel",
  "Sylvie",
  "Blaise",
  "Cécile",
  "André",
  "Aïcha",
  "Serge",
  "Odile",
  "Patrick",
  "Ginette",
  "Hervé",
  "Nadège",
  "Bertrand",
  "Solange",
  "Yannick",
  "Pauline",
];

const LAST_NAMES = [
  "Mballa",
  "Ngono",
  "Fotso",
  "Kamga",
  "Nkolo",
  "Etoundi",
  "Fouda",
  "Tchoua",
  "Nguemo",
  "Talla",
  "Onana",
  "Essomba",
  "Mvondo",
  "Nana",
  "Kenmogne",
  "Ateba",
  "Ndongo",
  "Mbarga",
  "Abena",
  "Biloa",
];

// Petit hash déterministe (FNV-1a) : mêmes entrées => même tuple à chaque seed.
const hash = (input: string): number => {
  let h = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  return h >>> 0;
};

const buildPersona = (seedKey: string) => {
  const h = hash(seedKey);

  const firstName = FIRST_NAMES[h % FIRST_NAMES.length] as string;
  const lastName = LAST_NAMES[Math.floor(h / FIRST_NAMES.length) % LAST_NAMES.length] as string;

  // Numéro camerounais plausible : +237 6XX XXX XXX
  const mobilePrefixes = ["65", "67", "68", "69"];
  const prefix = mobilePrefixes[h % mobilePrefixes.length];
  const digits = String(h).padStart(9, "0").slice(-7);
  const phone = `+237 6${prefix.slice(1)}${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)}`;

  return { firstName, lastName, phone };
};

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
        const persona = buildPersona(`${establishment.code}-${role.name}-${index}`);

        const seededUser = await prisma.user.upsert({
          where: {
            establishmentId_email: {
              establishmentId: establishment.id,
              email,
            },
          },
          update: {
            firstName: persona.firstName,
            lastName: persona.lastName,
            phone: persona.phone,
          },
          create: {
            email,
            password: hashedPassword,
            firstName: persona.firstName,
            lastName: persona.lastName,
            phone: persona.phone,
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
