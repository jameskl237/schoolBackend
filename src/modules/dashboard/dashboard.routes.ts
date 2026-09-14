import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { DashboardController } from "./dashboard.controller.js";

const router = Router();
const controller = new DashboardController();

router.get(
  "/dashboard/stats",
  authenticate,
  authorize("dashboard.view"),
  controller.getStats.bind(controller),
);

export default router;
