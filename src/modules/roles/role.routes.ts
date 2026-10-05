import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { RoleController } from "./role.controller.js";

const router = Router();
const controller = new RoleController();
// La liste sert aussi au formulaire utilisateur : elle reste ouverte à qui gère les comptes.
const canList = authorize("users.view", "users.manage", "roles.manage");
const canManage = authorize("roles.manage");

router.get("/roles", authenticate, canList, controller.list.bind(controller));
router.get("/permissions", authenticate, canManage, controller.listPermissions.bind(controller));
router.post("/roles", authenticate, canManage, controller.create.bind(controller));
router.patch("/roles/:id", authenticate, canManage, controller.update.bind(controller));
router.put(
  "/roles/:id/permissions",
  authenticate,
  canManage,
  controller.setPermissions.bind(controller),
);
router.delete("/roles/:id", authenticate, canManage, controller.remove.bind(controller));

export default router;
