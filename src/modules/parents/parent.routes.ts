import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { ParentController } from "./parent.controller.js";

const router = Router();
const controller = new ParentController();
const canManage = authorize("parents.manage");

router.get("/parents", authenticate, canManage, controller.list.bind(controller));
router.get("/parents/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/parents", authenticate, canManage, controller.create.bind(controller));
router.patch("/parents/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/parents/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
