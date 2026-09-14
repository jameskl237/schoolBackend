import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { EnrollmentController } from "./enrollment.controller.js";

const router = Router();
const controller = new EnrollmentController();
const canManage = authorize("enrollments.manage");

router.get("/enrollments", authenticate, canManage, controller.list.bind(controller));
router.get("/enrollments/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/enrollments", authenticate, canManage, controller.create.bind(controller));
router.patch("/enrollments/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/enrollments/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
