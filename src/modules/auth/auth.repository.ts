import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class AuthRepository {
  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  findByEmailAndEstablishmentCode(email: string, establishmentCode: string) {
    return prisma.user.findFirst({
      where: {
        email,
        establishment: { code: establishmentCode },
      },
    });
  }

  /** Tous les comptes portant cette adresse, quel que soit l'établissement. */
  findManyByEmail(email: string) {
    return prisma.user.findMany({
      where: { email },
      include: { establishment: { select: { id: true, code: true, name: true } } },
    });
  }

  findEstablishmentByCode(code: string) {
    return prisma.establishment.findUnique({ where: { code } });
  }

  /** Profils applicatifs rattachés au compte : ils déterminent son périmètre de lecture. */
  findProfileIds(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        teacher: { select: { id: true } },
        student: { select: { id: true } },
        parent: { select: { id: true } },
        guardian: { select: { id: true } },
      },
    });
  }

  findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  updateLastLogin(id: number) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
