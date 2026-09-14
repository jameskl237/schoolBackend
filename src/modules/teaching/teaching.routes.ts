import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { TeachingController } from "./teaching.controller.js";

const router = Router();
const controller = new TeachingController();
// Espace de travail de l'enseignant : le service ne renvoie que son propre périmètre.
const canTeach = authorize("evaluations.manage", "grades.manage", "attendances.manage");

router.get("/my-classes", authenticate, canTeach, controller.myClasses.bind(controller));

export default router;
