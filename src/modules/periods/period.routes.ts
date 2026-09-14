import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { PeriodController } from "./period.controller.js";

const router = Router();
const controller = new PeriodController();
// Les enseignants lisent les périodes pour rattacher leurs évaluations.
const canView = authorize("periods.manage", "evaluations.manage", "report-cards.view");
const canManage = authorize("periods.manage");

router.get("/periods", authenticate, canView, controller.list.bind(controller));
router.get("/periods/:id", authenticate, canView, controller.get.bind(controller));
router.post("/periods", authenticate, canManage, controller.create.bind(controller));
router.patch("/periods/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/periods/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
