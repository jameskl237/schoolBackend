import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { AuthController } from "./auth.controller.js";

const router = Router();
const authController = new AuthController();

router.post("/auth/register", authController.register.bind(authController));
router.post("/auth/login", authController.login.bind(authController));
router.post("/auth/refresh", authController.refresh.bind(authController));
router.post("/auth/logout", authController.logout.bind(authController));
router.get("/auth/me", authenticate, authController.me.bind(authController));

export default router;
