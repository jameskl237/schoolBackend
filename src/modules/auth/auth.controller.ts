import type { CookieOptions, NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { env } from "../../config/env.js";

import { loginSchema, registerSchema } from "./auth.dto.js";
import { AuthService } from "./auth.service.js";

const authService = new AuthService();

const REFRESH_COOKIE_NAME = "refreshToken";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/auth/refresh",
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body);

      const { user, accessToken, refreshToken } = await authService.register(input);

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

      res.status(201).json({
        success: true,
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);

      const { user, accessToken, refreshToken } = await authService.login(input);

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

      res.status(200).json({
        success: true,
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies as Record<string, string | undefined> | undefined;
      const refreshToken = token?.[REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        throw new AppError("Refresh token missing", 401, "MISSING_REFRESH_TOKEN");
      }

      const result = await authService.refresh(refreshToken);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);

      res.status(200).json({
        success: true,
        data: { user: result.user, accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  logout(_req: Request, res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: refreshCookieOptions.path });

    res.status(204).send();
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const user = await authService.me(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
