import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { SectionController } from "./section.controller.js";

const router = Router();
const controller = new SectionController();
const canManage = authorize("sections.manage");

router.get("/sections", authenticate, canManage, controller.list.bind(controller));
router.get("/sections/:id", authenticate, canManage, controller.get.bind(controller));
router.post("/sections", authenticate, canManage, controller.create.bind(controller));
router.patch("/sections/:id", authenticate, canManage, controller.update.bind(controller));
router.delete("/sections/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
