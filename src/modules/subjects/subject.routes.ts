import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { SubjectController } from "./subject.controller.js";

const router = Router();
const controller = new SubjectController();
// Les enseignants consultent les matières pour leurs évaluations, sans pouvoir les modifier.
const canView = authorize("subjects.manage", "class-subjects.manage", "evaluations.manage");
const canManage = authorize("subjects.manage");

router.get("/subjects", authenticate, canView, controller.list.bind(controller));
router.get("/subjects/:id", authenticate, canView, controller.get.bind(controller));
router.post("/subjects", authenticate, canManage, controller.create.bind(controller));
router.patch("/subjects/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/subjects/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
