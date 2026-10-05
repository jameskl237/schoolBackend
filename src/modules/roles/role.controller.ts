import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { getScope } from "../../common/utils/access-scope.js";

import { createRoleSchema, setPermissionsSchema, updateRoleSchema } from "./role.dto.js";
import { RoleService } from "./role.service.js";

const roleService = new RoleService();

const parseId = (value: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid role id", 400, "INVALID_ID");
  }

  return id;
};

export class RoleController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: await roleService.list(getScope(req).establishmentId),
      });
    } catch (error) {
      next(error);
    }
  }

  async listPermissions(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: await roleService.listPermissions() });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRoleSchema.parse(req.body);

      const role = await roleService.create(getScope(req).establishmentId, input);

      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateRoleSchema.parse(req.body);

      const role = await roleService.update(
        parseId(req.params.id as string),
        getScope(req).establishmentId,
        input,
      );

      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const input = setPermissionsSchema.parse(req.body);

      const role = await roleService.setPermissions(
        parseId(req.params.id as string),
        getScope(req).establishmentId,
        input,
      );

      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await roleService.remove(parseId(req.params.id as string), getScope(req).establishmentId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
