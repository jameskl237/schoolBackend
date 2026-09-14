import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";

import { broadcastNotificationSchema } from "./notification.dto.js";
import { NotificationService } from "./notification.service.js";

const notificationService = new NotificationService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid notification id", 400, "INVALID_ID");
  }

  return id;
};

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await notificationService.list(getScope(req).userId, req.query.unread === "true"),
      });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markRead(
        parseId(req.params.id as string),
        getScope(req).userId,
      );

      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await notificationService.markAllRead(getScope(req).userId),
      });
    } catch (error) {
      next(error);
    }
  }

  async broadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const input = broadcastNotificationSchema.parse(req.body);

      const count = await notificationService.broadcastToParents(input);

      res.status(201).json({ success: true, data: { delivered: count } });
    } catch (error) {
      next(error);
    }
  }
}
