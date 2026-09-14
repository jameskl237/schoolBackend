import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import {
  createRouteSchema,
  createSubscriptionSchema,
  updateRouteSchema,
  updateSubscriptionSchema,
} from "./transport.dto.js";
import { TransportService } from "./transport.service.js";

const transportService = new TransportService();

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

export class TransportController {
  async listRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await transportService.listRoutes(getScope(req).establishmentId),
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await transportService.getRoute(
        parseId(req.params.id as string, "transport route"),
        getScope(req).establishmentId,
      );

      res.status(200).json({ success: true, data: route });
    } catch (error) {
      next(error);
    }
  }

  async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRouteSchema.parse(req.body);

      const route = await transportService.createRoute(getScope(req).establishmentId, input);

      res.status(201).json({ success: true, data: route });
    } catch (error) {
      next(error);
    }
  }

  async updateRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateRouteSchema.parse(req.body);

      const route = await transportService.updateRoute(
        parseId(req.params.id as string, "transport route"),
        getScope(req).establishmentId,
        input,
      );

      res.status(200).json({ success: true, data: route });
    } catch (error) {
      next(error);
    }
  }

  async removeRoute(req: Request, res: Response, next: NextFunction) {
    try {
      await transportService.removeRoute(
        parseId(req.params.id as string, "transport route"),
        getScope(req).establishmentId,
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async listSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await transportService.listSubscriptions(
          getScope(req),
          stripUndefined({
            studentId: parseOptionalId(req.query.studentId, "studentId"),
            routeId: parseOptionalId(req.query.routeId, "routeId"),
            academicYearId: parseOptionalId(req.query.academicYearId, "academicYearId"),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await transportService.getSubscription(
        parseId(req.params.id as string, "transport subscription"),
        getScope(req),
      );

      res.status(200).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }

  async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSubscriptionSchema.parse(req.body);

      const subscription = await transportService.createSubscription(
        getScope(req).establishmentId,
        input,
      );

      res.status(201).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateSubscriptionSchema.parse(req.body);

      const subscription = await transportService.updateSubscription(
        parseId(req.params.id as string, "transport subscription"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }

  async removeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      await transportService.removeSubscription(
        parseId(req.params.id as string, "transport subscription"),
        getScope(req),
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
