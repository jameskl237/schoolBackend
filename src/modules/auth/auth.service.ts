import { AppError } from "../../common/errors/app-error.js";
import { getUserPermissions } from "../../common/utils/get-user-permissions.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import { comparePassword, hashPassword } from "../../common/utils/password.js";
import type { User } from "../../generated/prisma/client.js";

import type { LoginInput, RegisterInput } from "./auth.dto.js";
import { AuthRepository } from "./auth.repository.js";

const sanitizeUser = ({ password: _password, ...rest }: User) => rest;

/** Profils rattachés au compte : le client en a besoin pour savoir ce qu'il peut éditer. */
interface ProfileIds {
  teacherId: number | null;
  studentId: number | null;
  parentId: number | null;
  guardianId: number | null;
}

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  async register(input: RegisterInput) {
    const establishment = await this.authRepository.findEstablishmentByCode(
      input.establishmentCode,
    );

    if (!establishment) {
      throw new AppError("Establishment not found", 404, "ESTABLISHMENT_NOT_FOUND");
    }

    const existing = await this.authRepository.findByEmailAndEstablishmentCode(
      input.email,
      input.establishmentCode,
    );

    if (existing) {
      throw new AppError("Email already in use", 409, "EMAIL_ALREADY_EXISTS");
    }

    const { establishmentCode: _establishmentCode, password, phone, ...rest } = input;

    const user = await this.authRepository.createUser({
      ...rest,
      password: await hashPassword(password),
      phone: phone ?? null,
      establishment: { connect: { id: establishment.id } },
    });

    return this.issueTokens(user);
  }

  async login(input: LoginInput) {
    const establishment = await this.authRepository.findEstablishmentByCode(
      input.establishmentCode,
    );

    if (!establishment) {
      throw new AppError(
        "This establishment code does not exist",
        404,
        "ESTABLISHMENT_NOT_FOUND",
      );
    }

    const user = await this.authRepository.findByEmailAndEstablishmentCode(
      input.email,
      input.establishmentCode,
    );

    if (!user) {
      throw new AppError(
        "No account with this email in this establishment",
        404,
        "USER_NOT_IN_ESTABLISHMENT",
      );
    }

    if (!(await comparePassword(input.password, user.password))) {
      throw new AppError("Incorrect password", 401, "INVALID_PASSWORD");
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

    const [permissions, profiles] = await Promise.all([
      getUserPermissions(id),
      this.loadProfileIds(id),
    ]);

    return { ...sanitizeUser(user), permissions, ...profiles };
  }

  private async loadProfileIds(userId: number): Promise<ProfileIds> {
    const profiles = await this.authRepository.findProfileIds(userId);

    return {
      teacherId: profiles?.teacher?.id ?? null,
      studentId: profiles?.student?.id ?? null,
      parentId: profiles?.parent?.id ?? null,
      guardianId: profiles?.guardian?.id ?? null,
    };
  }

  private async issueTokens(user: User) {
    const [permissions, profiles] = await Promise.all([
      getUserPermissions(user.id),
      this.authRepository.findProfileIds(user.id),
    ]);

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      establishmentId: user.establishmentId,
      permissions,
      ...(profiles?.teacher ? { teacherId: profiles.teacher.id } : {}),
      ...(profiles?.student ? { studentId: profiles.student.id } : {}),
      ...(profiles?.parent ? { parentId: profiles.parent.id } : {}),
      ...(profiles?.guardian ? { guardianId: profiles.guardian.id } : {}),
    });

    const refreshToken = signRefreshToken({ sub: user.id });

    return {
      user: {
        ...sanitizeUser(user),
        permissions,
        teacherId: profiles?.teacher?.id ?? null,
        studentId: profiles?.student?.id ?? null,
        parentId: profiles?.parent?.id ?? null,
        guardianId: profiles?.guardian?.id ?? null,
      },
      accessToken,
      refreshToken,
    };
  }
}
