import type { Request, Response } from "express";

import { HealthService } from "./health.service.js";

const healthService = new HealthService();

export class HealthController {
  check(_req: Request, res: Response) {
    res.status(200).json(healthService.check());
  }
}
