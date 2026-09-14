import { z } from "zod";

import { NotificationType } from "../../generated/prisma/enums.js";

/** Diffusion d'une annonce (événement scolaire, convocation...) à tous les comptes parents. */
export const broadcastNotificationSchema = z.object({
  type: z.enum(NotificationType).default(NotificationType.GENERAL),
  title: z.string().min(1),
  message: z.string().min(1),
  link: z.string().optional(),
});

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;