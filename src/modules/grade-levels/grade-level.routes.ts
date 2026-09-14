import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { GradeLevelController } from "./grade-level.controller.js";

const router = Router();
const controller = new GradeLevelController();
const canManage = authorize("grade-levels.manage");

router.get("/grade-levels", authenticate, canManage, controller.list.bind(controller));
router.get("/grade-levels/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/grade-levels", authenticate, canManage, controller.create.bind(controller));
router.patch("/grade-levels/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/grade-levels/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
