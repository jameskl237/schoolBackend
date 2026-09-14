import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { AcademicYearController } from "./academic-year.controller.js";

const router = Router();
const controller = new AcademicYearController();
const canManage = authorize("academic-years.manage");

router.get("/academic-years", authenticate, canManage, controller.list.bind(controller));
router.get("/academic-years/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/academic-years", authenticate, canManage, controller.create.bind(controller));
router.patch("/academic-years/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/academic-years/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
