import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { createGradeLevelSchema, updateGradeLevelSchema } from "./grade-level.dto.js";
import { GradeLevelService } from "./grade-level.service.js";

const gradeLevelService = new GradeLevelService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid grade level id", 400, "INVALID_ID");
  }

  return id;
};

const parseOptionalCycleId = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid cycleId filter", 400, "INVALID_CYCLE_ID");
  }

  return id;
};

const getEstablishmentId = (req: Request): number => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.establishmentId;
};

export class GradeLevelController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await gradeLevelService.list(
          getEstablishmentId(req),
          parseOptionalCycleId(req.query.cycleId),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const gradeLevel = await gradeLevelService.get(
        parseId(req.params.id as string),
        getEstablishmentId(req),
      );

      res.status(200).json({ success: true, data: gradeLevel });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createGradeLevelSchema.parse(req.body);

      const gradeLevel = await gradeLevelService.create(getEstablishmentId(req), input);

      res.status(201).json({ success: true, data: gradeLevel });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateGradeLevelSchema.parse(req.body);

      const gradeLevel = await gradeLevelService.update(
        parseId(req.params.id as string),
        getEstablishmentId(req),
        input,
      );

      res.status(200).json({ success: true, data: gradeLevel });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await gradeLevelService.remove(parseId(req.params.id as string), getEstablishmentId(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
