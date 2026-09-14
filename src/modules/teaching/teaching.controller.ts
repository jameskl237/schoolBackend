import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";

import { TeachingService } from "./teaching.service.js";

const teachingService = new TeachingService();

const parseOptionalId = (value: unknown, label: string): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Invalid ${label} filter`, 400, "INVALID_FILTER");
  }

  return id;
};

export class TeachingController {
  async myClasses(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await teachingService.myClasses(
          getScope(req),
          parseOptionalId(req.query.academicYearId, "academicYearId"),
        ),
      });
    } catch (error) {
      next(error);
    }
  }
}
