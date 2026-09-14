import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { TimetableController } from "./timetable.controller.js";

const router = Router();
const controller = new TimetableController();
const canView = authorize("timetables.view", "timetables.manage");
const canManage = authorize("timetables.manage");

router.get("/timetables", authenticate, canView, controller.list.bind(controller));
router.get("/timetables/:id", authenticate, canView, controller.get.bind(controller));
router.post("/timetables", authenticate, canManage, controller.create.bind(controller));
router.patch("/timetables/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/timetables/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
