import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { SequenceController } from "./sequence.controller.js";

const router = Router();
const controller = new SequenceController();
// Les enseignants et les élèves lisent les séquences pour situer les évaluations.
const canView = authorize("periods.manage", "evaluations.manage", "grades.view");
const canManage = authorize("periods.manage");

router.get("/sequences", authenticate, canView, controller.list.bind(controller));
router.get("/sequences/:id", authenticate, canView, controller.get.bind(controller));
router.post("/sequences", authenticate, canManage, controller.create.bind(controller));
router.patch("/sequences/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/sequences/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
