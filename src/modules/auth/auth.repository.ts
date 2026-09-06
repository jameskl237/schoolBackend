import { prisma } from "../../infrastructure/database/prisma.js";

export class AuthRepository {
  findByEmailAndEstablishment(email: string, establishmentId: number) {
    return prisma.user.findUnique({
      where: {
        establishmentId_email: {
          establishmentId,
          email,
        },
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
