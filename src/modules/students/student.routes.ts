import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { StudentController } from "./student.controller.js";

const router = Router();
const controller = new StudentController();
// students.view = périmètre du compte ; students.view.all = registre complet.
const canView = authorize("students.view", "students.view.all", "students.manage");
const canManage = authorize("students.manage");
const canEnroll = authorize("enrollments.manage");

router.get("/students", authenticate, canView, controller.list.bind(controller));
router.get("/students/:id", authenticate, canView, controller.get.bind(controller));
router.post("/students", authenticate, canManage, controller.create.bind(controller));
router.patch("/students/:id", authenticate, canManage, controller.update.bind(controller));
router.patch(
  "/students/:id/enrollment",
  authenticate,
  canEnroll,
  controller.updateEnrollment.bind(controller),
);
router.delete("/students/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
