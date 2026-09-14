import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import { createTimetableSchema, updateTimetableSchema } from "./timetable.dto.js";
import { TimetableService } from "./timetable.service.js";

const timetableService = new TimetableService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid timetable id", 400, "INVALID_ID");
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

export class TimetableController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await timetableService.list(
          getScope(req),
          stripUndefined({
            classId: parseOptionalId(req.query.classId, "classId"),
            teacherId: parseOptionalId(req.query.teacherId, "teacherId"),
            classroomId: parseOptionalId(req.query.classroomId, "classroomId"),
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
      const timetable = await timetableService.get(parseId(req.params.id as string), getScope(req));

      res.status(200).json({ success: true, data: timetable });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTimetableSchema.parse(req.body);

      const timetable = await timetableService.create(getScope(req).establishmentId, input);

      res.status(201).json({ success: true, data: timetable });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateTimetableSchema.parse(req.body);

      const timetable = await timetableService.update(
        parseId(req.params.id as string),
        getScope(req).establishmentId,
        input,
      );

      res.status(200).json({ success: true, data: timetable });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await timetableService.remove(
        parseId(req.params.id as string),
        getScope(req).establishmentId,
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
