import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import {
  createBookSchema,
  createCopySchema,
  createLoanSchema,
  updateBookSchema,
  updateCopySchema,
  updateLoanSchema,
} from "./library.dto.js";
import { LibraryService } from "./library.service.js";

const service = new LibraryService();

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

export class LibraryController {
  async listBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;

      res.status(200).json({ success: true, data: await service.listBooks(getScope(req), search) });
    } catch (error) {
      next(error);
    }
  }

  async getBook(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await service.getBook(parseId(req.params.id as string, "book"), getScope(req));

      res.status(200).json({ success: true, data: book });
    } catch (error) {
      next(error);
    }
  }

  async createBook(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createBookSchema.parse(req.body);

      res.status(201).json({ success: true, data: await service.createBook(getScope(req), input) });
    } catch (error) {
      next(error);
    }
  }

  async updateBook(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateBookSchema.parse(req.body);

      const book = await service.updateBook(
        parseId(req.params.id as string, "book"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: book });
    } catch (error) {
      next(error);
    }
  }

  async removeBook(req: Request, res: Response, next: NextFunction) {
    try {
      await service.removeBook(parseId(req.params.id as string, "book"), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addCopies(req: Request, res: Response, next: NextFunction) {
    try {
      const count = Number(req.body?.count ?? 1);

      if (!Number.isInteger(count) || count < 1 || count > 100) {
        throw new AppError("Le nombre d'exemplaires doit être compris entre 1 et 100", 400, "INVALID_COUNT");
      }

      const book = await service.addCopies(
        getScope(req),
        parseId(req.params.id as string, "book"),
        count,
      );

      res.status(201).json({ success: true, data: book });
    } catch (error) {
      next(error);
    }
  }

  async createCopy(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createCopySchema.parse(req.body);

      res.status(201).json({ success: true, data: await service.createCopy(getScope(req), input) });
    } catch (error) {
      next(error);
    }
  }

  async updateCopy(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateCopySchema.parse(req.body);

      const copy = await service.updateCopy(
        parseId(req.params.id as string, "copy"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: copy });
    } catch (error) {
      next(error);
    }
  }

  async removeCopy(req: Request, res: Response, next: NextFunction) {
    try {
      await service.removeCopy(parseId(req.params.id as string, "copy"), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async listLoans(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await service.listLoans(
          getScope(req),
          stripUndefined({
            status: typeof req.query.status === "string" ? req.query.status : undefined,
            studentId: parseOptionalId(req.query.studentId, "studentId"),
            teacherId: parseOptionalId(req.query.teacherId, "teacherId"),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async createLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createLoanSchema.parse(req.body);

      res.status(201).json({ success: true, data: await service.createLoan(getScope(req), input) });
    } catch (error) {
      next(error);
    }
  }

  async returnLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const loan = await service.returnLoan(parseId(req.params.id as string, "loan"), getScope(req));

      res.status(200).json({ success: true, data: loan });
    } catch (error) {
      next(error);
    }
  }

  async updateLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateLoanSchema.parse(req.body);

      const loan = await service.updateLoan(
        parseId(req.params.id as string, "loan"),
        getScope(req),
        input,
      );

      res.status(200).json({ success: true, data: loan });
    } catch (error) {
      next(error);
    }
  }

  async removeLoan(req: Request, res: Response, next: NextFunction) {
    try {
      await service.removeLoan(parseId(req.params.id as string, "loan"), getScope(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
