import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { CycleController } from "./cycle.controller.js";

const router = Router();
const controller = new CycleController();
const canManage = authorize("cycles.manage");

router.get("/cycles", authenticate, canManage, controller.list.bind(controller));
router.get("/cycles/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/cycles", authenticate, canManage, controller.create.bind(controller));
router.patch("/cycles/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/cycles/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
