import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { ClassroomController } from "./classroom.controller.js";

const router = Router();
const controller = new ClassroomController();
const canManage = authorize("classrooms.manage");

router.get("/classrooms", authenticate, canManage, controller.list.bind(controller));
router.get("/classrooms/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/classrooms", authenticate, canManage, controller.create.bind(controller));
router.patch("/classrooms/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/classrooms/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
