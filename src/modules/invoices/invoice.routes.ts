import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { InvoiceController } from "./invoice.controller.js";

const router = Router();
const controller = new InvoiceController();
const canManage = authorize("invoices.manage");

router.get("/invoices", authenticate, canManage, controller.list.bind(controller));
router.get("/invoices/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/invoices", authenticate, canManage, controller.create.bind(controller));
router.patch("/invoices/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/invoices/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
