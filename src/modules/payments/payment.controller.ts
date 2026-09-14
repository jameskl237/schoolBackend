import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { createPaymentSchema } from "./payment.dto.js";
import { PaymentService } from "./payment.service.js";

const paymentService = new PaymentService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid payment id", 400, "INVALID_ID");
  }

  return id;
};

const parseOptionalInvoiceId = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid invoiceId filter", 400, "INVALID_INVOICE_ID");
  }

  return id;
};

const getUser = (req: Request) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user;
};

export class PaymentController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getUser(req);

      res.status(200).json({
        success: true,
        data: await paymentService.list(user.establishmentId, parseOptionalInvoiceId(req.query.invoiceId)),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getUser(req);
      const input = createPaymentSchema.parse(req.body);

      const payment = await paymentService.create(user.establishmentId, user.id, input);

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getUser(req);

      await paymentService.remove(parseId(req.params.id as string), user.establishmentId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
