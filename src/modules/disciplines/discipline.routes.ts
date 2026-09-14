import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { DisciplineController } from "./discipline.controller.js";

const router = Router();
const controller = new DisciplineController();
const canView = authorize("disciplines.view", "disciplines.manage");
const canManage = authorize("disciplines.manage");

router.get("/disciplines", authenticate, canView, controller.list.bind(controller));
router.post("/disciplines", authenticate, canManage, controller.create.bind(controller));
router.patch("/disciplines/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/disciplines/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;