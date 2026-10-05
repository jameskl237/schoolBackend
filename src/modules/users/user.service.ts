import { AppError } from "../../common/errors/app-error.js";
import { hashPassword } from "../../common/utils/password.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { RoleRepository } from "../roles/role.repository.js";

import type { CreateUserInput, UpdateUserInput } from "./user.dto.js";
import { UserRepository } from "./user.repository.js";

export class UserService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly roleRepository = new RoleRepository(),
  ) {}

  private async assertRoleBelongsToEstablishment(roleId: number, establishmentId: number) {
    const found = await this.roleRepository.findManyByIds([roleId], establishmentId);

    if (found.length !== 1) {
      throw new AppError("This role does not exist in your establishment", 400, "INVALID_ROLE");
    }
  }

  list(establishmentId: number) {
    return this.userRepository.findMany(establishmentId);
  }

  async get(id: number, establishmentId: number) {
    const user = await this.userRepository.findById(id, establishmentId);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  }

  async create(establishmentId: number, input: CreateUserInput) {
    const { email, password, phone, roleId, ...rest } = input;

    await this.assertRoleBelongsToEstablishment(roleId, establishmentId);

    return this.userRepository.create({
      email,
      password: await hashPassword(password),
      phone: phone ?? null,
      ...rest,
      establishment: { connect: { id: establishmentId } },
      role: { connect: { id: roleId } },
    });
  }

  async update(id: number, establishmentId: number, input: UpdateUserInput) {
    await this.get(id, establishmentId);

    const { roleId, ...fields } = input;

    if (roleId !== undefined) {
      await this.assertRoleBelongsToEstablishment(roleId, establishmentId);
    }

    const data = stripUndefined(fields);

    if (data.password !== undefined) {
      data.password = await hashPassword(data.password);
    }

    return this.userRepository.update(id, {
      ...data,
      ...(roleId !== undefined ? { role: { connect: { id: roleId } } } : {}),
    });
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.userRepository.delete(id);
  }
}
