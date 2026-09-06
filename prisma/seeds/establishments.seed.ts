import { SchoolType } from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

const establishments = [
  {
    name: "École Primaire Les Petits Génies",
    code: "PRIMAIRE_DEMO",
    type: SchoolType.PRIMARY,
  },
  {
    name: "Collège & Lycée La Réussite",
    code: "SECONDAIRE_DEMO",
    type: SchoolType.SECONDARY,
  },
  {
    name: "Complexe Scolaire Le Savoir",
    code: "HYBRIDE_DEMO",
    type: SchoolType.BOTH,
  },
] as const;

export async function seedEstablishments() {
  const results = [];

  for (const establishment of establishments) {
    const seeded = await prisma.establishment.upsert({
      where: { code: establishment.code },
      update: {},
      create: {
        ...establishment,
      },
    });

    results.push(seeded);
  }

  return results;
}