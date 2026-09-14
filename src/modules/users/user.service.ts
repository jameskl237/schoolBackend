import { AppError } from "../../common/errors/app-error.js";
import { hashPassword } from "../../common/utils/password.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { RoleRepository } from "../roles/role.repository.js";

import type { CreateUserInput, UpdateUserInput } from "./user.dto.js";
import { UserRepository } from "./user.repository.js";

type UserWithRoles = {
  userRoles: { role: { id: number; name: string } }[];
} & Record<string, unknown>;

const toResponse = ({ userRoles, ...rest }: UserWithRoles) => ({
  ...rest,
  roles: userRoles.map((userRole) => userRole.role),
});

export class UserService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly roleRepository = new RoleRepository(),
  ) {}

  private async assertRolesBelongToEstablishment(roleIds: number[], establishmentId: number) {
    if (roleIds.length === 0) return;

    const found = await this.roleRepository.findManyByIds(roleIds, establishmentId);

    if (found.length !== roleIds.length) {
      throw new AppError("One or more roles are invalid", 400, "INVALID_ROLES");
    }
  }

  async list(establishmentId: number) {
    const users = await this.userRepository.findMany(establishmentId);

    return users.map(toResponse);
  }

  async get(id: number, establishmentId: number) {
    const user = await this.userRepository.findById(id, establishmentId);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return toResponse(user);
  }

  async create(establishmentId: number, input: CreateUserInput) {
    const { email, password, phone, roleIds, ...rest } = input;

    await this.assertRolesBelongToEstablishment(roleIds ?? [], establishmentId);

    const user = await this.userRepository.create({
      email,
      password: await hashPassword(password),
      phone: phone ?? null,
      ...rest,
      establishment: {
        connect: { id: establishmentId },
      },
      ...(roleIds && roleIds.length > 0
        ? { userRoles: { create: roleIds.map((roleId) => ({ roleId })) } }
        : {}),
    });

    return toResponse(user);
  }

  async update(id: number, establishmentId: number, input: UpdateUserInput) {
    await this.get(id, establishmentId);

    const { roleIds, ...fields } = input;

    if (roleIds !== undefined) {
      await this.assertRolesBelongToEstablishment(roleIds, establishmentId);
      await this.userRepository.setRoles(id, roleIds);
    }

    const data = stripUndefined(fields);

    if (data.password !== undefined) {
      data.password = await hashPassword(data.password);
    }

    const user = await this.userRepository.update(id, data);

    return toResponse(user);
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.userRepository.delete(id);
  }
}
