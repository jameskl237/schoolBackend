import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { ClassController } from "./class.controller.js";

const router = Router();
const controller = new ClassController();
const canManage = authorize("classes.manage");

router.get("/classes", authenticate, canManage, controller.list.bind(controller));
router.get("/classes/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/classes", authenticate, canManage, controller.create.bind(controller));
router.patch("/classes/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/classes/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
