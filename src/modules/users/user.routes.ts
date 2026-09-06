import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { UserController } from "./user.controller.js";

const router = Router();
const userController = new UserController();

router.get("/users", authenticate, userController.list.bind(userController));
router.get("/users/:id", authenticate, userController.get.bind(userController));
router.post("/users", authenticate, userController.create.bind(userController));
router.patch("/users/:id", authenticate, userController.update.bind(userController));
router.delete("/users/:id", authenticate, userController.remove.bind(userController));

export default router;
