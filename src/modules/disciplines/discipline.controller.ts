import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { SanctionType } from "../../generated/prisma/enums.js";

import {
  createDisciplineRecordSchema,
  updateDisciplineRecordSchema,
} from "./discipline.dto.js";
import type { DisciplineFilters } from "./discipline.repository.js";
import { DisciplineService } from "./discipline.service.js";

const disciplineService = new DisciplineService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid discipline record id", 400, "INVALID_ID");
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

export class DisciplineController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: DisciplineFilters = stripUndefined({
        studentId: parseOptionalId(req.query.studentId, "studentId"),
        classId: parseOptionalId(req.query.classId, "classId"),
        type:
          typeof req.query.type === "string" ? this.parseSanctionType(req.query.type) : undefined,
        from: parseOptionalDate(req.query.from, "from"),
        to: parseOptionalDate(req.query.to, "to"),
      });

      res.status(200).json({
        success: true,
        data: await disciplineService.list(getScope(req), filters),
      });
    } catch (error) {
      next(error);
    }
  }

  private parseSanctionType(value: string) {
    if (!Object.values(SanctionType).includes(value as SanctionType)) {
      throw new AppError("Invalid discipline type filter", 400, "INVALID_FILTER");
    }

    return value as SanctionType;
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createDisciplineRecordSchema.parse(req.body);

      const record = await disciplineService.create(getScope(req), input);

      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateDisciplineRecordSchema.parse(req.body);

      const record = await disciplineService.update(
        parseId(req.params.id as string),
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
      await disciplineService.remove(parseId(req.params.id as string), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}