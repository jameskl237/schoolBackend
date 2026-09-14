import { prisma } from "../src/infrastructure/database/prisma.js";
import { seedPermissions } from "./seeds/permissions.seed.js";
import { seedRoles } from "./seeds/roles.seed.js";

async function main() {
  await seedPermissions();
  const establishments = await prisma.establishment.findMany();
  await seedRoles(establishments);
  console.log("✅ Permissions et rôles reconciliés (disciplines.view inclus).");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
