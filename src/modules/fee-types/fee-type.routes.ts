import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { FeeTypeController } from "./fee-type.controller.js";

const router = Router();
const controller = new FeeTypeController();
const canManage = authorize("fees.manage");

router.get("/fee-types", authenticate, canManage, controller.list.bind(controller));
router.get("/fee-types/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/fee-types", authenticate, canManage, controller.create.bind(controller));
router.patch("/fee-types/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/fee-types/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
