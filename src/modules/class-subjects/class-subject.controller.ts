import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import {
  createClassSubjectSchema,
  updateClassSubjectSchema,
} from "./class-subject.dto.js";
import { ClassSubjectService } from "./class-subject.service.js";

const classSubjectService = new ClassSubjectService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid class subject id", 400, "INVALID_ID");
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

export class ClassSubjectController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await classSubjectService.list(
          getScope(req),
          stripUndefined({
            classId: parseOptionalId(req.query.classId, "classId"),
            teacherId: parseOptionalId(req.query.teacherId, "teacherId"),
            academicYearId: parseOptionalId(req.query.academicYearId, "academicYearId"),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const classSubject = await classSubjectService.get(
        parseId(req.params.id as string),
        getScope(req),
      );

      res.status(200).json({ success: true, data: classSubject });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createClassSubjectSchema.parse(req.body);

      const classSubject = await classSubjectService.create(getScope(req).establishmentId, input);

      res.status(201).json({ success: true, data: classSubject });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateClassSubjectSchema.parse(req.body);

      const classSubject = await classSubjectService.update(
        parseId(req.params.id as string),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: classSubject });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await classSubjectService.remove(parseId(req.params.id as string), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
