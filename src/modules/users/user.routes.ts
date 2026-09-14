import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { UserController } from "./user.controller.js";

const router = Router();
const userController = new UserController();

router.get(
  "/users",
  authenticate,
  authorize("users.view", "users.manage"),
  userController.list.bind(userController),
);
router.get(
  "/users/:id",
  authenticate,
  authorize("users.view", "users.manage"),
  userController.get.bind(userController),
);
router.post(
  "/users",
  authenticate,
  authorize("users.manage"),
  userController.create.bind(userController),
);
router.patch(
  "/users/:id",
  authenticate,
  authorize("users.manage"),
  userController.update.bind(userController),
);
router.delete(
  "/users/:id",
  authenticate,
  authorize("users.manage"),
  userController.remove.bind(userController),
);

export default router;
