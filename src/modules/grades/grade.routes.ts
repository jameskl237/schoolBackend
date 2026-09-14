import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { GradeController } from "./grade.controller.js";

const router = Router();
const controller = new GradeController();
// grades.view : consultation (administration, enseignant, élève — chacun sur son périmètre).
// grades.manage : saisie, que seul l'enseignant de la matière possède.
const canView = authorize("grades.view", "grades.manage");
const canManage = authorize("grades.manage");

router.get("/grades", authenticate, canView, controller.list.bind(controller));
router.put("/grades", authenticate, canManage, controller.save.bind(controller));
router.patch("/grades/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/grades/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
