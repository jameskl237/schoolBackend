import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class NotificationRepository {
  findMany(userId: number, onlyUnread = false) {
    return prisma.notification.findMany({
      where: { userId, ...(onlyUnread ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  countUnread(userId: number) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  findById(id: number, userId: number) {
    return prisma.notification.findFirst({ where: { id, userId } });
  }

  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  }

  createMany(data: Prisma.NotificationUncheckedCreateInput[]) {
    if (data.length === 0) {
      return Promise.resolve(0);
    }

    return prisma.notification.createMany({ data });
  }

  markRead(id: number) {
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  markAllRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
