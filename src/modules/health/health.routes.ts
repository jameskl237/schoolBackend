import { Router } from "express";

import { HealthController } from "./health.controller.js";

const router = Router();
const healthController = new HealthController();

router.get("/health", healthController.check.bind(healthController));

export default router;
