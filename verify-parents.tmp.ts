import { prisma } from "/home/jameskl237/Documents/private/School/schoolBackend/src/infrastructure/database/prisma.js";
async function main() {
  const missing = await prisma.student.findMany({
    where: { studentParents: { none: { parent: { userId: { not: null } } } } },
    select: { id: true, studentNumber: true },
  });
  console.log("Students without account-linked parent:", missing.length);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
