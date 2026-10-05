import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { OrientationController } from "./orientation.controller.js";

const router = Router();
const controller = new OrientationController();
const canManage = authorize("orientations.manage");
// Tenir une séance suppose de voir le dossier auquel elle se rattache.
const canRead = authorize("orientations.manage", "counseling.manage");
const canCounsel = authorize("counseling.manage", "orientations.manage");

router.get("/orientations", authenticate, canRead, controller.list.bind(controller));
router.get("/orientations/:id", authenticate, canRead, controller.get.bind(controller));
router.post("/orientations", authenticate, canManage, controller.create.bind(controller));
router.patch("/orientations/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/orientations/:id", authenticate, canManage, controller.remove.bind(controller));

router.post("/counseling-sessions", authenticate, canCounsel, controller.addSession.bind(controller));
router.patch(
  "/counseling-sessions/:id",
  authenticate,
  canCounsel,
  controller.updateSession.bind(controller),
);
router.delete(
  "/counseling-sessions/:id",
  authenticate,
  canCounsel,
  controller.removeSession.bind(controller),
);

export default router;
