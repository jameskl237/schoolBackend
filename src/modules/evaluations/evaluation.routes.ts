import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";

import { AppError } from "../../common/errors/app-error.js";
import { MAX_EXAM_PAPER_BYTES, examPaperUpload } from "../../common/utils/exam-paper-storage.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { EvaluationController } from "./evaluation.controller.js";

const router = Router();
const controller = new EvaluationController();
// L'administration consulte (grades.view), l'enseignant crée et valide (evaluations.manage).
const canView = authorize("evaluations.manage", "grades.view");
const canManage = authorize("evaluations.manage");

// multer écrit le fichier avant le contrôleur : on traduit ses erreurs (taille,
// type) en réponses JSON, et on supprime le fichier côtéservice si non autorisé.
const handleUpload = (request: Request, response: Response, next: NextFunction) => {
  examPaperUpload.single("file")(request, response, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(
        new AppError(
          `The exam paper file must be ${MAX_EXAM_PAPER_BYTES / (1024 * 1024)} MB or smaller`,
          400,
          "FILE_TOO_LARGE",
        ),
      );
      return;
    }

    next(error);
  });
};

router.get("/evaluations", authenticate, canView, controller.list.bind(controller));
router.get("/evaluations/:id", authenticate, canView, controller.get.bind(controller));
router.post("/evaluations", authenticate, canManage, controller.create.bind(controller));
router.patch("/evaluations/:id", authenticate, canManage, controller.update.bind(controller));
router.post("/evaluations/:id/validate", authenticate, canManage, controller.validate.bind(controller));
router.post("/evaluations/:id/reopen", authenticate, canManage, controller.reopen.bind(controller));
router.delete("/evaluations/:id", authenticate, canManage, controller.remove.bind(controller));

router.post("/evaluations/:id/exam-paper", authenticate, canManage, handleUpload, controller.uploadExamPaper.bind(controller));
router.get("/evaluations/:id/exam-paper", authenticate, canView, controller.downloadExamPaper.bind(controller));
router.delete("/evaluations/:id/exam-paper", authenticate, canManage, controller.removeExamPaper.bind(controller));

export default router;