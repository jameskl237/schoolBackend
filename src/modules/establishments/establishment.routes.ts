import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { EstablishmentController } from "./establishment.controller.js";

const router = Router();
const controller = new EstablishmentController();

router.get("/establishments/me", authenticate, controller.getMine.bind(controller));
router.patch(
  "/establishments/me",
  authenticate,
  authorize("establishments.manage"),
  controller.updateMine.bind(controller),
);

export default router;
