import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { DashboardService } from "./dashboard.service.js";

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      res.status(200).json({
        success: true,
        data: await dashboardService.getStats(req.user.establishmentId),
      });
    } catch (error) {
      next(error);
    }
  }
}
