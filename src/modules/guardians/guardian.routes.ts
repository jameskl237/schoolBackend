import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { GuardianController } from "./guardian.controller.js";

const router = Router();
const controller = new GuardianController();
const canManage = authorize("guardians.manage");

router.get("/guardians", authenticate, canManage, controller.list.bind(controller));
router.get("/guardians/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/guardians", authenticate, canManage, controller.create.bind(controller));
router.patch("/guardians/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/guardians/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
