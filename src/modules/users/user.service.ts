import { AppError } from "../../common/errors/app-error.js";
import { hashPassword } from "../../common/utils/password.js";
import type { Prisma } from "../../generated/prisma/client.js";

import type { CreateUserInput, UpdateUserInput } from "./user.dto.js";
import { UserRepository } from "./user.repository.js";

export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async list(establishmentId: number) {
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
    const { email, password, phone, ...rest } = input;

    const user = await this.userRepository.create({
      email,
      password: await hashPassword(password),
      phone: phone ?? null,
      ...rest,
      establishment: {
        connect: { id: establishmentId },
      },
    });

    return user;
  }

  async update(id: number, establishmentId: number, input: UpdateUserInput) {
    await this.get(id, establishmentId);

    const data: Prisma.UserUpdateInput = {};

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        (data as Record<string, unknown>)[key] = value;
      }
    }

    if (data.password !== undefined) {
      data.password = await hashPassword(data.password as string);
    }

    return this.userRepository.update(id, data);
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.userRepository.delete(id);
  }
}
