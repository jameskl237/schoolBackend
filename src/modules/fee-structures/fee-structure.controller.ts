import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { createFeeStructureSchema, updateFeeStructureSchema } from "./fee-structure.dto.js";
import { FeeStructureService } from "./fee-structure.service.js";

const feeStructureService = new FeeStructureService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid fee structure id", 400, "INVALID_ID");
  }

  return id;
};

const parseOptionalAcademicYearId = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid academicYearId filter", 400, "INVALID_ACADEMIC_YEAR_ID");
  }

  return id;
};

const getEstablishmentId = (req: Request): number => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.establishmentId;
};

export class FeeStructureController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await feeStructureService.list(
          getEstablishmentId(req),
          parseOptionalAcademicYearId(req.query.academicYearId),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const feeStructure = await feeStructureService.get(
        parseId(req.params.id as string),
        getEstablishmentId(req),
      );

      res.status(200).json({ success: true, data: feeStructure });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createFeeStructureSchema.parse(req.body);

      const feeStructure = await feeStructureService.create(getEstablishmentId(req), input);

      res.status(201).json({ success: true, data: feeStructure });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateFeeStructureSchema.parse(req.body);

      const feeStructure = await feeStructureService.update(
        parseId(req.params.id as string),
        getEstablishmentId(req),
        input,
      );

      res.status(200).json({ success: true, data: feeStructure });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await feeStructureService.remove(parseId(req.params.id as string), getEstablishmentId(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
