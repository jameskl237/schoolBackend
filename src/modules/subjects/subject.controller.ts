import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { createSubjectSchema, updateSubjectSchema } from "./subject.dto.js";
import { SubjectService } from "./subject.service.js";

const subjectService = new SubjectService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid subject id", 400, "INVALID_ID");
  }

  return id;
};

const getEstablishmentId = (req: Request): number => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.establishmentId;
};

export class SubjectController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await subjectService.list(getEstablishmentId(req)),
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = await subjectService.get(
        parseId(req.params.id as string),
        getEstablishmentId(req),
      );

      res.status(200).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSubjectSchema.parse(req.body);

      const subject = await subjectService.create(getEstablishmentId(req), input);

      res.status(201).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateSubjectSchema.parse(req.body);

      const subject = await subjectService.update(
        parseId(req.params.id as string),
        getEstablishmentId(req),
        input,
      );

      res.status(200).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await subjectService.remove(parseId(req.params.id as string), getEstablishmentId(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
