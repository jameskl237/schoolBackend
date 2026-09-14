import { prisma } from "../src/infrastructure/database/prisma.js";

import { seedAcademicYears } from "./seeds/academic-years.seed.js";
import { seedAcademics } from "./seeds/academics.seed.js";
import { seedEstablishments } from "./seeds/establishments.seed.js";
import { seedFinance } from "./seeds/finance.seed.js";
import { seedHealth } from "./seeds/health.seed.js";
import { seedLibrary } from "./seeds/library.seed.js";
import { seedOrientation } from "./seeds/orientation.seed.js";
import { seedOrganization } from "./seeds/organization.seed.js";
import { seedPermissions } from "./seeds/permissions.seed.js";
import { seedRoles } from "./seeds/roles.seed.js";
import { seedStudents } from "./seeds/students.seed.js";
import { seedUsers } from "./seeds/users.seed.js";

async function main() {
  // eslint-disable-next-line no-console
  console.log("→ Permissions, établissements, rôles et utilisateurs...");
  await seedPermissions();
  const establishments = await seedEstablishments();
  await seedRoles(establishments);
  await seedUsers(establishments);

  // eslint-disable-next-line no-console
  console.log("→ Années scolaires 2020/2021 → 2026/2027 et périodes...");
  await seedAcademicYears(establishments);

  // eslint-disable-next-line no-console
  console.log("→ Organisation pédagogique (niveaux, sections, cycles, classes, matières, enseignants)...");
  const organizations = await seedOrganization(establishments);

  // eslint-disable-next-line no-console
  console.log("→ Élèves, parents, tuteurs et inscriptions...");
  await seedStudents(establishments, organizations);

  // eslint-disable-next-line no-console
  console.log("→ Emplois du temps, évaluations, notes, bulletins, présences et discipline...");
  await seedAcademics(establishments, organizations);

  // eslint-disable-next-line no-console
  console.log("→ Finances (frais, factures, paiements)...");
  await seedFinance(establishments);

  // eslint-disable-next-line no-console
  console.log("→ Santé (dossiers médicaux, vaccinations, infirmerie)...");
  await seedHealth(establishments);

  // eslint-disable-next-line no-console
  console.log("→ Bibliothèque (livres, exemplaires, emprunts)...");
  await seedLibrary(establishments);

  // eslint-disable-next-line no-console
  console.log("→ Orientation et conseil...");
  await seedOrientation(establishments);

  // eslint-disable-next-line no-console
  console.log("✅ Seed terminé : toutes les données de démonstration ont été créées.");
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
