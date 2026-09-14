import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { RoleController } from "./role.controller.js";

const router = Router();
const roleController = new RoleController();

router.get(
  "/roles",
  authenticate,
  authorize("users.view", "users.manage"),
  roleController.list.bind(roleController),
);

export default router;
