import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import { createInvoiceSchema, updateInvoiceSchema } from "./invoice.dto.js";
import { InvoiceService } from "./invoice.service.js";

const invoiceService = new InvoiceService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid invoice id", 400, "INVALID_ID");
  }

  return id;
};

const parseOptionalId = (value: unknown, label: string): number | undefined => {
  if (value === undefined) return undefined;

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Invalid ${label} filter`, 400, "INVALID_FILTER");
  }

  return id;
};

const getEstablishmentId = (req: Request): number => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.establishmentId;
};

export class InvoiceController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await invoiceService.list(
          getEstablishmentId(req),
          stripUndefined({
            studentId: parseOptionalId(req.query.studentId, "studentId"),
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
      const invoice = await invoiceService.get(parseId(req.params.id as string), getEstablishmentId(req));

      res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createInvoiceSchema.parse(req.body);

      const invoice = await invoiceService.create(getEstablishmentId(req), input);

      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateInvoiceSchema.parse(req.body);

      const invoice = await invoiceService.update(
        parseId(req.params.id as string),
        getEstablishmentId(req),
        input,
      );

      res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await invoiceService.remove(parseId(req.params.id as string), getEstablishmentId(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
