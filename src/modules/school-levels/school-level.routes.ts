import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { SchoolLevelController } from "./school-level.controller.js";

const router = Router();
const controller = new SchoolLevelController();
const canManage = authorize("school-levels.manage");

router.get("/school-levels", authenticate, canManage, controller.list.bind(controller));
router.get("/school-levels/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/school-levels", authenticate, canManage, controller.create.bind(controller));
router.patch("/school-levels/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/school-levels/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
