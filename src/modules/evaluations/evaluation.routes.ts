import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { EvaluationController } from "./evaluation.controller.js";

const router = Router();
const controller = new EvaluationController();
// L'administration consulte (grades.view), l'enseignant crée et valide (evaluations.manage).
const canView = authorize("evaluations.manage", "grades.view");
const canManage = authorize("evaluations.manage");

router.get("/evaluations", authenticate, canView, controller.list.bind(controller));
router.get("/evaluations/:id", authenticate, canView, controller.get.bind(controller));
router.post("/evaluations", authenticate, canManage, controller.create.bind(controller));
router.patch("/evaluations/:id", authenticate, canManage, controller.update.bind(controller));
router.post("/evaluations/:id/validate", authenticate, canManage, controller.validate.bind(controller));
router.post("/evaluations/:id/reopen", authenticate, canManage, controller.reopen.bind(controller));
router.delete("/evaluations/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
