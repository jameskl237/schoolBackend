import fs from "node:fs";

import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { examPaperAbsolutePath } from "../../common/utils/exam-paper-storage.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import { createEvaluationSchema, updateEvaluationSchema } from "./evaluation.dto.js";
import { EvaluationService } from "./evaluation.service.js";

const evaluationService = new EvaluationService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid evaluation id", 400, "INVALID_ID");
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

export class EvaluationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await evaluationService.list(
          getScope(req),
          stripUndefined({
            classSubjectId: parseOptionalId(req.query.classSubjectId, "classSubjectId"),
            periodId: parseOptionalId(req.query.periodId, "periodId"),
            sequenceId: parseOptionalId(req.query.sequenceId, "sequenceId"),
            classId: parseOptionalId(req.query.classId, "classId"),
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
      const evaluation = await evaluationService.get(
        parseId(req.params.id as string),
        getScope(req),
      );

      res.status(200).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createEvaluationSchema.parse(req.body);

      const evaluation = await evaluationService.create(getScope(req), input);

      res.status(201).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateEvaluationSchema.parse(req.body);

      const evaluation = await evaluationService.update(
        parseId(req.params.id as string),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const evaluation = await evaluationService.validate(
        parseId(req.params.id as string),
        getScope(req),
      );

      res.status(200).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }

  async reopen(req: Request, res: Response, next: NextFunction) {
    try {
      const evaluation = await evaluationService.reopen(
        parseId(req.params.id as string),
        getScope(req),
      );

      res.status(200).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await evaluationService.remove(parseId(req.params.id as string), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async uploadExamPaper(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError("Missing exam paper file", 400, "MISSING_FILE");
      }

      const evaluation = await evaluationService.attachExamPaper(
        parseId(req.params.id as string),
        getScope(req),
        req.file,
      );

      res.status(200).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }

  async downloadExamPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const evaluation = await evaluationService.getExamPaper(
        parseId(req.params.id as string),
        getScope(req),
      );

      const examPaperPath = evaluation.examPaperPath;

      if (!examPaperPath) {
        throw new AppError("No exam paper available for this evaluation", 404, "EXAM_PAPER_NOT_FOUND");
      }

      const absolutePath = examPaperAbsolutePath(examPaperPath);

      if (!fs.existsSync(absolutePath)) {
        throw new AppError("The exam paper file is missing on the server", 404, "EXAM_PAPER_FILE_MISSING");
      }

      res.download(absolutePath, evaluation.examPaperName ?? "exam-paper.pdf");
    } catch (error) {
      next(error);
    }
  }

  async removeExamPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const evaluation = await evaluationService.detachExamPaper(
        parseId(req.params.id as string),
        getScope(req),
      );

      res.status(200).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }
}
