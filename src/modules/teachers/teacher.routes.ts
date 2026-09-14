import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { TeacherController } from "./teacher.controller.js";

const router = Router();
const controller = new TeacherController();
const canView = authorize("teachers.manage", "class-subjects.manage", "timetables.manage");
const canManage = authorize("teachers.manage");

router.get("/teachers", authenticate, canView, controller.list.bind(controller));
router.get("/teachers/:id", authenticate, canView, controller.get.bind(controller));
router.post("/teachers", authenticate, canManage, controller.create.bind(controller));
router.patch("/teachers/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/teachers/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
