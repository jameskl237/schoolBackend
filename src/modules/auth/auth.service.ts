import { AppError } from "../../common/errors/app-error.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import { comparePassword, hashPassword } from "../../common/utils/password.js";
import type { User } from "../../generated/prisma/client.js";
import { UserRepository } from "../users/user.repository.js";

import type { LoginInput, RegisterInput } from "./auth.dto.js";
import { AuthRepository } from "./auth.repository.js";

const sanitizeUser = ({ password: _password, ...rest }: User) => rest;

export class AuthService {
  constructor(
    private readonly authRepository = new AuthRepository(),
    private readonly userRepository = new UserRepository(),
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.authRepository.findByEmailAndEstablishment(
      input.email,
      input.establishmentId,
    );

    if (existing) {
      throw new AppError("Email already in use", 409, "EMAIL_ALREADY_EXISTS");
    }

    const { establishmentId, password, phone, ...rest } = input;

    const user = await this.userRepository.create({
      ...rest,
      password: await hashPassword(password),
      phone: phone ?? null,
      establishment: { connect: { id: establishmentId } },
    });

    return this.issueTokens(user);
  }

  async login(input: LoginInput) {
    const user = await this.authRepository.findByEmailAndEstablishment(
      input.email,
      input.establishmentId,
    );

    if (!user || !(await comparePassword(input.password, user.password))) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new AppError("Account is disabled", 403, "ACCOUNT_DISABLED");
    }

    await this.authRepository.updateLastLogin(user.id);

    return this.issueTokens(user);
  }

  async refresh(token: string) {
    let payload;

    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const user = await this.authRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    return this.issueTokens(user);
  }

  async me(id: number) {
    const user = await this.authRepository.findById(id);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return sanitizeUser(user);
  }

  private issueTokens(user: User) {
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      establishmentId: user.establishmentId,
    });

    const refreshToken = signRefreshToken({ sub: user.id });

    return { user: sanitizeUser(user), accessToken, refreshToken };
  }
}
