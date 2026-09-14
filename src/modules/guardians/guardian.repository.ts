import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const guardianInclude = {
  studentGuardians: {
    select: {
      relationType: true,
      isFinanciallyResponsible: true,
      canPickup: true,
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
    },
  },
} satisfies Prisma.GuardianInclude;

export class GuardianRepository {
  findMany(establishmentId: number) {
    return prisma.guardian.findMany({
      where: { establishmentId },
      include: guardianInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.guardian.findFirst({ where: { id, establishmentId }, include: guardianInclude });
  }

  create(data: Prisma.GuardianCreateInput) {
    return prisma.guardian.create({ data, include: guardianInclude });
  }

  update(id: number, data: Prisma.GuardianUpdateInput) {
    return prisma.guardian.update({ where: { id }, data, include: guardianInclude });
  }

  delete(id: number) {
    return prisma.guardian.delete({ where: { id } });
  }

  setStudentLinks(
    guardianId: number,
    links: {
      studentId: number;
      relationType: string;
      isFinanciallyResponsible?: boolean | undefined;
      canPickup?: boolean | undefined;
    }[],
  ) {
    return prisma.$transaction([
      prisma.studentGuardian.deleteMany({ where: { guardianId } }),
      ...(links.length > 0
        ? [
            prisma.studentGuardian.createMany({
              data: links.map((link) => ({
                guardianId,
                studentId: link.studentId,
                relationType: link.relationType as Prisma.StudentGuardianCreateManyInput["relationType"],
                isFinanciallyResponsible: link.isFinanciallyResponsible ?? false,
                canPickup: link.canPickup ?? true,
              })),
            }),
          ]
        : []),
    ]);
  }
}
