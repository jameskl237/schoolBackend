import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";

import {
  createVaccinationSchema,
  createVisitSchema,
  saveMedicalRecordSchema,
  updateVaccinationSchema,
  updateVisitSchema,
} from "./health-record.dto.js";
import { HealthRecordService } from "./health-record.service.js";

const service = new HealthRecordService();

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

export class HealthRecordController {
  async listRecords(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: await service.listRecords(getScope(req)) });
    } catch (error) {
      next(error);
    }
  }

  async getRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await service.getRecord(
        parseId(req.params.studentId as string, "student"),
        getScope(req),
      );

      res.status(200).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async saveRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const input = saveMedicalRecordSchema.parse(req.body);

      const record = await service.saveRecord(
        parseId(req.params.studentId as string, "student"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async addVaccination(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createVaccinationSchema.parse(req.body);

      res.status(201).json({ success: true, data: await service.addVaccination(getScope(req), input) });
    } catch (error) {
      next(error);
    }
  }

  async updateVaccination(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateVaccinationSchema.parse(req.body);

      const vaccination = await service.updateVaccination(
        parseId(req.params.id as string, "vaccination"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: vaccination });
    } catch (error) {
      next(error);
    }
  }

  async removeVaccination(req: Request, res: Response, next: NextFunction) {
    try {
      await service.removeVaccination(parseId(req.params.id as string, "vaccination"), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async listVisits(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await service.listVisits(
          getScope(req),
          parseOptionalId(req.query.studentId, "studentId"),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async createVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createVisitSchema.parse(req.body);

      res.status(201).json({ success: true, data: await service.createVisit(getScope(req), input) });
    } catch (error) {
      next(error);
    }
  }

  async updateVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateVisitSchema.parse(req.body);

      const visit = await service.updateVisit(
        parseId(req.params.id as string, "visit"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: visit });
    } catch (error) {
      next(error);
    }
  }

  async removeVisit(req: Request, res: Response, next: NextFunction) {
    try {
      await service.removeVisit(parseId(req.params.id as string, "visit"), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
