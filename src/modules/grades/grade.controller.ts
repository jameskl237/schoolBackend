import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import { saveGradesSchema, updateGradeSchema } from "./grade.dto.js";
import { GradeService } from "./grade.service.js";

const gradeService = new GradeService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid grade id", 400, "INVALID_ID");
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

export class GradeController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await gradeService.list(
          getScope(req),
          stripUndefined({
            evaluationId: parseOptionalId(req.query.evaluationId, "evaluationId"),
            studentId: parseOptionalId(req.query.studentId, "studentId"),
            periodId: parseOptionalId(req.query.periodId, "periodId"),
            sequenceId: parseOptionalId(req.query.sequenceId, "sequenceId"),
            classId: parseOptionalId(req.query.classId, "classId"),
            academicYearId: parseOptionalId(req.query.academicYearId, "academicYearId"),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async save(req: Request, res: Response, next: NextFunction) {
    try {
      const input = saveGradesSchema.parse(req.body);

      const grades = await gradeService.saveSheet(getScope(req), input);

      res.status(200).json({ success: true, data: grades });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateGradeSchema.parse(req.body);

      const grade = await gradeService.update(
        parseId(req.params.id as string),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: grade });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await gradeService.remove(parseId(req.params.id as string), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
