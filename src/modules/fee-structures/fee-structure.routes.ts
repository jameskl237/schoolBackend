import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { FeeStructureController } from "./fee-structure.controller.js";

const router = Router();
const controller = new FeeStructureController();
const canManage = authorize("fees.manage");

router.get("/fee-structures", authenticate, canManage, controller.list.bind(controller));
router.get("/fee-structures/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/fee-structures", authenticate, canManage, controller.create.bind(controller));
router.patch("/fee-structures/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/fee-structures/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
