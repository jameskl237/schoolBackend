import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import {
  createStudentSchema,
  updateStudentEnrollmentSchema,
  updateStudentSchema,
} from "./student.dto.js";
import { StudentService } from "./student.service.js";

const studentService = new StudentService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid student id", 400, "INVALID_ID");
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

export class StudentController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await studentService.list(
          getScope(req),
          stripUndefined({
            classId: parseOptionalId(req.query.classId, "classId"),
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
      const student = await studentService.get(parseId(req.params.id as string), getScope(req));

      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createStudentSchema.parse(req.body);

      const student = await studentService.create(getScope(req), input);

      res.status(201).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateStudentSchema.parse(req.body);

      const student = await studentService.update(
        parseId(req.params.id as string),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  async updateEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateStudentEnrollmentSchema.parse(req.body);

      const student = await studentService.updateEnrollmentStatus(
        parseId(req.params.id as string),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await studentService.remove(parseId(req.params.id as string), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
