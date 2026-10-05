import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import {
  createOrientationSchema,
  createSessionSchema,
  updateOrientationSchema,
  updateSessionSchema,
} from "./orientation.dto.js";
import { OrientationService } from "./orientation.service.js";

const service = new OrientationService();

const parseId = (value: string, label: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Invalid ${label} id`, 400, "INVALID_ID");
  }

  return id;
};

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

export class OrientationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await service.list(
          getScope(req),
          stripUndefined({
            studentId: parseOptionalId(req.query.studentId, "studentId"),
            academicYearId: parseOptionalId(req.query.academicYearId, "academicYearId"),
            status: typeof req.query.status === "string" ? req.query.status : undefined,
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await service.get(parseId(req.params.id as string, "orientation"), getScope(req));

      res.status(200).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createOrientationSchema.parse(req.body);

      res.status(201).json({ success: true, data: await service.create(getScope(req), input) });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateOrientationSchema.parse(req.body);

      const record = await service.update(
        parseId(req.params.id as string, "orientation"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.remove(parseId(req.params.id as string, "orientation"), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addSession(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSessionSchema.parse(req.body);

      res.status(201).json({ success: true, data: await service.addSession(getScope(req), input) });
    } catch (error) {
      next(error);
    }
  }

  async updateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateSessionSchema.parse(req.body);

      const session = await service.updateSession(
        parseId(req.params.id as string, "session"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async removeSession(req: Request, res: Response, next: NextFunction) {
    try {
      await service.removeSession(parseId(req.params.id as string, "session"), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
