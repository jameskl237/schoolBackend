import { DEFAULT_ACCOUNT_PASSWORD } from "../src/common/utils/account-provisioning.js";
import { hashPassword } from "../src/common/utils/password.js";
import { prisma } from "../src/infrastructure/database/prisma.js";

/**
 * Remet tous les comptes sur le mot de passe initial commun.
 *
 * Utilitaire de démonstration : les comptes ouverts à différentes époques
 * portaient des mots de passe différents, ce qui rendait impossible de savoir
 * lequel s'appliquait. À ne pas exécuter sur des données réelles.
 */
const run = async () => {
  const hashed = await hashPassword(DEFAULT_ACCOUNT_PASSWORD);

  const { count } = await prisma.user.updateMany({ data: { password: hashed } });

  // eslint-disable-next-line no-console
  console.log(`${count} compte(s) remis sur le mot de passe « ${DEFAULT_ACCOUNT_PASSWORD} ».`);
};

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
