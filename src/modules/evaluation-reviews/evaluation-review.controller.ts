import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";

import { createReviewSchema } from "./evaluation-review.dto.js";
import { EvaluationReviewService } from "./evaluation-review.service.js";

const reviewService = new EvaluationReviewService();

const parseId = (value: string, label: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Invalid ${label} id`, 400, "INVALID_ID");
  }

  return id;
};

export class EvaluationReviewController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await reviewService.list(
          parseId(req.params.evaluationId as string, "evaluation"),
          getScope(req),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createReviewSchema.parse(req.body);

      const review = await reviewService.create(
        parseId(req.params.evaluationId as string, "evaluation"),
        getScope(req),
        input,
      );

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.resolve(
        parseId(req.params.id as string, "review"),
        getScope(req),
      );

      res.status(200).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
}
