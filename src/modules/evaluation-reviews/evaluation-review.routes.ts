import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { EvaluationReviewController } from "./evaluation-review.controller.js";

const router = Router();
const controller = new EvaluationReviewController();
// Le service vérifie ensuite la qualité de professeur principal ou d'enseignant de la matière.
const canReview = authorize("evaluations.manage", "grades.view");

router.get(
  "/evaluations/:evaluationId/reviews",
  authenticate,
  canReview,
  controller.list.bind(controller),
);
router.post(
  "/evaluations/:evaluationId/reviews",
  authenticate,
  canReview,
  controller.create.bind(controller),
);
router.post(
  "/evaluation-reviews/:id/resolve",
  authenticate,
  canReview,
  controller.resolve.bind(controller),
);

export default router;
