import type { NextFunction, Request, Response } from "express";

import { AppError } from "../common/errors/app-error.js";

/**
 * Requires the authenticated user to hold at least one of the given permission codes.
 * Must run after `authenticate` (reads `req.user.permissions` from the access token).
 */
export const authorize =
  (...requiredPermissions: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }

    const hasPermission = requiredPermissions.some((permission) =>
      req.user!.permissions.includes(permission),
    );

    if (!hasPermission) {
      next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
