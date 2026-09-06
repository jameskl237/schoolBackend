import { prisma } from "../src/infrastructure/database/prisma.js";

import { seedEstablishments } from "./seeds/establishments.seed.js";
import { seedPermissions } from "./seeds/permissions.seed.js";
import { seedRoles } from "./seeds/roles.seed.js";
import { seedUsers } from "./seeds/users.seed.js";

async function main() {
  await seedPermissions();
  const establishments = await seedEstablishments();
  await seedRoles(establishments);
  await seedUsers(establishments);

  // eslint-disable-next-line no-console
  console.log("✅ Seed terminé : permissions, établissements, rôles et utilisateurs créés.");
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