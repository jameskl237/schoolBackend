import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { AttendanceController } from "./attendance.controller.js";

const router = Router();
const controller = new AttendanceController();
const canView = authorize("attendances.view", "attendances.manage");
const canManage = authorize("attendances.manage");

router.get("/attendances", authenticate, canView, controller.list.bind(controller));
router.put("/attendances", authenticate, canManage, controller.save.bind(controller));
router.patch("/attendances/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/attendances/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
