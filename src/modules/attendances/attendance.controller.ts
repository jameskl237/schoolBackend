import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import { saveAttendancesSchema, updateAttendanceSchema } from "./attendance.dto.js";
import { AttendanceService } from "./attendance.service.js";

const attendanceService = new AttendanceService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid attendance id", 400, "INVALID_ID");
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

const parseOptionalDate = (value: unknown, label: string): Date | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${label} filter`, 400, "INVALID_FILTER");
  }

  return date;
};

export class AttendanceController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await attendanceService.list(
          getScope(req),
          stripUndefined({
            classId: parseOptionalId(req.query.classId, "classId"),
            studentId: parseOptionalId(req.query.studentId, "studentId"),
            from: parseOptionalDate(req.query.from, "from"),
            to: parseOptionalDate(req.query.to, "to"),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async save(req: Request, res: Response, next: NextFunction) {
    try {
      const input = saveAttendancesSchema.parse(req.body);

      const attendances = await attendanceService.saveSheet(getScope(req), input);

      res.status(200).json({ success: true, data: attendances });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateAttendanceSchema.parse(req.body);

      const attendance = await attendanceService.update(
        parseId(req.params.id as string),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await attendanceService.remove(parseId(req.params.id as string), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
