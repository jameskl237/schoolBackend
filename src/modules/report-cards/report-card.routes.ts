import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { ReportCardController } from "./report-card.controller.js";

const router = Router();
const controller = new ReportCardController();
const canView = authorize("report-cards.view", "report-cards.manage");
const canManage = authorize("report-cards.manage");

router.get("/report-cards", authenticate, canView, controller.list.bind(controller));
router.get("/report-cards/:id/bulletin", authenticate, canView, controller.bulletin.bind(controller));
router.post("/report-cards", authenticate, canManage, controller.create.bind(controller));
router.patch("/report-cards/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/report-cards/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;