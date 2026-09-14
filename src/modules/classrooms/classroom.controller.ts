import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";

import { createClassroomSchema, updateClassroomSchema } from "./classroom.dto.js";
import { ClassroomService } from "./classroom.service.js";

const classroomService = new ClassroomService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid classroom id", 400, "INVALID_ID");
  }

  return id;
};

const getEstablishmentId = (req: Request): number => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.establishmentId;
};

export class ClassroomController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await classroomService.list(getEstablishmentId(req), {
          onlyAvailable: req.query.available === "true",
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const classroom = await classroomService.get(
        parseId(req.params.id as string),
        getEstablishmentId(req),
      );

      res.status(200).json({ success: true, data: classroom });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createClassroomSchema.parse(req.body);

      const classroom = await classroomService.create(getEstablishmentId(req), input);

      res.status(201).json({ success: true, data: classroom });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateClassroomSchema.parse(req.body);

      const classroom = await classroomService.update(
        parseId(req.params.id as string),
        getEstablishmentId(req),
        input,
      );

      res.status(200).json({ success: true, data: classroom });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await classroomService.remove(parseId(req.params.id as string), getEstablishmentId(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
