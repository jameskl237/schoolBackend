import type { NextFunction, Request, Response } from "express";

import { AppError } from "../common/errors/app-error.js";
import { verifyAccessToken } from "../common/utils/jwt.js";

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      establishmentId: payload.establishmentId,
      permissions: payload.permissions,
      ...(payload.teacherId !== undefined ? { teacherId: payload.teacherId } : {}),
      ...(payload.studentId !== undefined ? { studentId: payload.studentId } : {}),
      ...(payload.parentId !== undefined ? { parentId: payload.parentId } : {}),
      ...(payload.guardianId !== undefined ? { guardianId: payload.guardianId } : {}),
    };

    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
  }
};
