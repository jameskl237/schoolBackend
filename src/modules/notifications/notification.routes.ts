import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { NotificationController } from "./notification.controller.js";

const router = Router();
const controller = new NotificationController();

// Chacun ne lit que ses propres notifications : aucune permission à exiger.
router.get("/notifications", authenticate, controller.list.bind(controller));
router.post("/notifications/read-all", authenticate, controller.markAllRead.bind(controller));
router.post("/notifications/:id/read", authenticate, controller.markRead.bind(controller));

// Diffusion d'une annonce à tous les parents : la scolarité s'en charge.
router.post(
  "/notifications/broadcast",
  authenticate,
  authorize("parents.manage"),
  controller.broadcast.bind(controller),
);

export default router;
