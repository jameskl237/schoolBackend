import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { updateEstablishmentSchema } from "./establishment.dto.js";
import { EstablishmentService } from "./establishment.service.js";

const establishmentService = new EstablishmentService();

const getEstablishmentId = (req: Request): number => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.establishmentId;
};

export class EstablishmentController {
  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await establishmentService.get(getEstablishmentId(req)),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMine(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateEstablishmentSchema.parse(req.body);

      const establishment = await establishmentService.update(getEstablishmentId(req), input);

      res.status(200).json({ success: true, data: establishment });
    } catch (error) {
      next(error);
    }
  }
}
