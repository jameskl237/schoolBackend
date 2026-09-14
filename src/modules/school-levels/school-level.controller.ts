import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { createSchoolLevelSchema, updateSchoolLevelSchema } from "./school-level.dto.js";
import { SchoolLevelService } from "./school-level.service.js";

const schoolLevelService = new SchoolLevelService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid school level id", 400, "INVALID_ID");
  }

  return id;
};

const getEstablishmentId = (req: Request): number => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.establishmentId;
};

export class SchoolLevelController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await schoolLevelService.list(getEstablishmentId(req)),
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolLevel = await schoolLevelService.get(
        parseId(req.params.id as string),
        getEstablishmentId(req),
      );

      res.status(200).json({ success: true, data: schoolLevel });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSchoolLevelSchema.parse(req.body);

      const schoolLevel = await schoolLevelService.create(getEstablishmentId(req), input);

      res.status(201).json({ success: true, data: schoolLevel });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateSchoolLevelSchema.parse(req.body);

      const schoolLevel = await schoolLevelService.update(
        parseId(req.params.id as string),
        getEstablishmentId(req),
        input,
      );

      res.status(200).json({ success: true, data: schoolLevel });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await schoolLevelService.remove(parseId(req.params.id as string), getEstablishmentId(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
