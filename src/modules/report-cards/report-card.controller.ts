import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import { BulletinBuilder } from "./report-card.bulletin.js";
import { createReportCardSchema, updateReportCardSchema } from "./report-card.dto.js";
import { ReportCardService } from "./report-card.service.js";

const reportCardService = new ReportCardService();
const bulletinBuilder = new BulletinBuilder();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid report card id", 400, "INVALID_ID");
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

export class ReportCardController {
  /** Le bulletin mis en forme : en-tête officiel, notes, statistiques de classe. */
  async bulletin(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await bulletinBuilder.build(parseId(req.params.id as string), getScope(req)),
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await reportCardService.list(
          getScope(req),
          stripUndefined({
            studentId: parseOptionalId(req.query.studentId, "studentId"),
            periodId: parseOptionalId(req.query.periodId, "periodId"),
            classId: parseOptionalId(req.query.classId, "classId"),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createReportCardSchema.parse(req.body);

      const reportCard = await reportCardService.create(getScope(req), input);

      res.status(201).json({ success: true, data: reportCard });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateReportCardSchema.parse(req.body);

      const reportCard = await reportCardService.update(
        parseId(req.params.id as string),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: reportCard });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await reportCardService.remove(parseId(req.params.id as string), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}