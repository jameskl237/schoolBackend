import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { PaymentController } from "./payment.controller.js";

const router = Router();
const controller = new PaymentController();
const canManage = authorize("payments.manage");

router.get("/payments", authenticate, canManage, controller.list.bind(controller));
router.post("/payments", authenticate, canManage, controller.create.bind(controller));
router.delete("/payments/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
