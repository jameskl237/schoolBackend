import { SchoolType } from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

// Format : TYPE-VILLE-000 (PRI = primaire, SEC = secondaire, MIX = les deux)
const establishments = [
  {
    name: "École Primaire Les Petits Génies",
    code: "PRI-YDE-001",
    type: SchoolType.PRIMARY,
  },
  {
    name: "Collège & Lycée La Réussite",
    code: "SEC-DLA-002",
    type: SchoolType.SECONDARY,
  },
  {
    name: "Complexe Scolaire Le Savoir",
    code: "MIX-BAF-003",
    type: SchoolType.BOTH,
  },
] as const;

export async function seedEstablishments() {
  const results = [];

  for (const establishment of establishments) {
    const existing = await prisma.establishment.findFirst({
      where: { OR: [{ code: establishment.code }, { name: establishment.name }] },
    });

    if (!existing) {
      results.push(await prisma.establishment.create({ data: { ...establishment } }));
      continue;
    }

    const seeded = await prisma.establishment.update({
      where: { id: existing.id },
      data: { ...establishment },
    });

    if (existing.code !== establishment.code) {
      // Les emails de démo intègrent le code établissement : on les ré-aligne
      // pour rester cohérent avec l'ancien format de code déjà en base.
      await prisma.$executeRaw`
        UPDATE User
        SET email = REPLACE(email, ${`@${existing.code.toLowerCase()}.demo`}, ${`@${establishment.code.toLowerCase()}.demo`})
        WHERE establishmentId = ${existing.id}
      `;
    }

    results.push(seeded);
  }

  return results;
}