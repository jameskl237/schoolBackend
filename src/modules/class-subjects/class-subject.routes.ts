import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { ClassSubjectController } from "./class-subject.controller.js";

const router = Router();
const controller = new ClassSubjectController();
// L'enseignant lit ses propres affectations (le service le restreint à lui-même).
const canView = authorize(
  "class-subjects.manage",
  "timetables.manage",
  "evaluations.manage",
  "attendances.manage",
);
const canManage = authorize("class-subjects.manage");

router.get("/class-subjects", authenticate, canView, controller.list.bind(controller));
router.get("/class-subjects/:id", authenticate, canView, controller.get.bind(controller));
router.post("/class-subjects", authenticate, canManage, controller.create.bind(controller));
router.patch("/class-subjects/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/class-subjects/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
