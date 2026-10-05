import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";

import type { CreateRoleInput, SetPermissionsInput, UpdateRoleInput } from "./role.dto.js";
import { RoleRepository } from "./role.repository.js";

type RoleRecord = Awaited<ReturnType<RoleRepository["findById"]>>;

const toResponse = (role: NonNullable<RoleRecord>) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  permissions: role.rolePermissions.map((rp) => rp.permission.code),
  userCount: role._count.users,
});

export class RoleService {
  constructor(private readonly roleRepository = new RoleRepository()) {}

  async list(establishmentId: number) {
    const roles = await this.roleRepository.findMany(establishmentId);

    return roles.map(toResponse);
  }

  listPermissions() {
    return this.roleRepository.listPermissions();
  }

  async get(id: number, establishmentId: number) {
    const role = await this.roleRepository.findById(id, establishmentId);

    if (!role) {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }

    return toResponse(role);
  }

  async create(establishmentId: number, input: CreateRoleInput) {
    try {
      const role = await this.roleRepository.create({
        establishmentId,
        name: input.name,
        description: input.description ?? null,
      });

      if (input.permissions !== undefined) {
        return await this.setPermissions(role.id, establishmentId, {
          permissions: input.permissions,
        });
      }

      return toResponse(role);
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async update(id: number, establishmentId: number, input: UpdateRoleInput) {
    await this.get(id, establishmentId);

    const role = await this.roleRepository.update(id, stripUndefined(input));

    return toResponse(role);
  }

  async setPermissions(id: number, establishmentId: number, input: SetPermissionsInput) {
    await this.get(id, establishmentId);

    const known = await this.roleRepository.listPermissions();
    const byCode = new Map(known.map((permission) => [permission.code, permission.id]));
    const unknown = input.permissions.filter((code) => !byCode.has(code));

    if (unknown.length > 0) {
      throw new AppError(
        `Permissions inconnues : ${unknown.join(", ")}`,
        400,
        "UNKNOWN_PERMISSIONS",
      );
    }

    const role = await this.roleRepository.setPermissions(
      id,
      input.permissions.map((code) => byCode.get(code) as number),
    );

    if (!role) {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }

    return toResponse(role);
  }

  /** Un rôle encore porté par des comptes ne peut pas disparaître sous eux. */
  async remove(id: number, establishmentId: number) {
    const role = await this.get(id, establishmentId);

    if (role.userCount > 0) {
      throw new AppError(
        `Ce rôle est porté par ${role.userCount} compte(s) : réaffectez-les d'abord`,
        409,
        "ROLE_IN_USE",
      );
    }

    return this.roleRepository.delete(id);
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError("Ce rôle existe déjà dans l'établissement", 409, "ROLE_ALREADY_EXISTS");
    }

    return error;
  }
}
