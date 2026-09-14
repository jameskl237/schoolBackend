import { AppError } from "../../common/errors/app-error.js";
import type { NotificationType } from "../../generated/prisma/enums.js";
import { prisma } from "../../infrastructure/database/prisma.js";

import type { BroadcastNotificationInput } from "./notification.dto.js";
import { NotificationRepository } from "./notification.repository.js";

export interface NotifyInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  constructor(private readonly notificationRepository = new NotificationRepository()) {}

  async list(userId: number, onlyUnread: boolean) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findMany(userId, onlyUnread),
      this.notificationRepository.countUnread(userId),
    ]);

    return { notifications, unreadCount };
  }

  /** Dépose une notification. Silencieuse si le destinataire n'a pas de compte. */
  notify(input: NotifyInput) {
    return this.notificationRepository.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      ...(input.link !== undefined ? { link: input.link } : {}),
    });
  }

  /** Dépose plusieurs notifications (ex. tous les parents d'un élève) en une écriture. */
  notifyMany(inputs: NotifyInput[]) {
    const created = inputs
      .map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        ...(input.link !== undefined ? { link: input.link } : {}),
      }))
      .filter((input) => input.userId !== null);

    return this.notificationRepository.createMany(created);
  }

  async markRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findById(id, userId);

    if (!notification) {
      throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
    }

    if (notification.readAt) {
      return notification;
    }

    return this.notificationRepository.markRead(id);
  }

  async markAllRead(userId: number) {
    await this.notificationRepository.markAllRead(userId);

    return this.list(userId, false);
  }

  /** Diffusion d'une annonce à tous les comptes ayant un dossier parent dans l'établissement. */
  async broadcastToParents(input: BroadcastNotificationInput) {
    const users = await prisma.user.findMany({
      where: { parent: { isNot: null } },
      select: { id: true },
    });

    return this.notifyMany(
      users.map((user) => ({
        userId: user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        ...(input.link !== undefined ? { link: input.link } : {}),
      })),
    );
  }
}
