import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { TransportController } from "./transport.controller.js";

const router = Router();
const controller = new TransportController();
// L'élève consulte son abonnement (transport.view) ; la gestion administre (transport.manage).
const canView = authorize("transport.view", "transport.manage");
const canManage = authorize("transport.manage");

router.get("/transport/routes", authenticate, canView, controller.listRoutes.bind(controller));
router.get("/transport/routes/:id", authenticate, canView, controller.getRoute.bind(controller));
router.post("/transport/routes", authenticate, canManage, controller.createRoute.bind(controller));
router.patch("/transport/routes/:id", authenticate, canManage, controller.updateRoute.bind(controller));
router.delete("/transport/routes/:id", authenticate, canManage, controller.removeRoute.bind(controller));

router.get(
  "/transport/subscriptions",
  authenticate,
  canView,
  controller.listSubscriptions.bind(controller),
);
router.get(
  "/transport/subscriptions/:id",
  authenticate,
  canView,
  controller.getSubscription.bind(controller),
);
router.post(
  "/transport/subscriptions",
  authenticate,
  canManage,
  controller.createSubscription.bind(controller),
);
router.patch(
  "/transport/subscriptions/:id",
  authenticate,
  canManage,
  controller.updateSubscription.bind(controller),
);
router.delete(
  "/transport/subscriptions/:id",
  authenticate,
  canManage,
  controller.removeSubscription.bind(controller),
);

export default router;
