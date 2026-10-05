import { AppError } from "../../common/errors/app-error.js";
import { ensureRole, PROFILE_ROLES } from "../../common/utils/account-provisioning.js";
import { getUserPermissions } from "../../common/utils/get-user-permissions.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import { comparePassword, hashPassword } from "../../common/utils/password.js";
import { prisma } from "../../infrastructure/database/prisma.js";
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

    // L'inscription libre ne choisit pas son rôle : elle ouvre un compte de
    // consultation. C'est à l'administration de le requalifier ensuite.
    const role = await ensureRole(prisma, establishment.id, PROFILE_ROLES.PARENT);

    const user = await this.authRepository.createUser({
      ...rest,
      password: await hashPassword(password),
      phone: phone ?? null,
      establishment: { connect: { id: establishment.id } },
      role: { connect: { id: role.id } },
    });

    return this.issueTokens(user);
  }

  /**
   * L'adresse et le mot de passe suffisent : le code d'établissement n'est
   * réclamé que si les mêmes identifiants ouvrent un compte dans plusieurs
   * écoles. Un parent n'a donc rien à retenir de plus que ses identifiants.
   */
  async login(input: LoginInput) {
    const user =
      input.establishmentCode !== undefined
        ? await this.findInEstablishment(input.email, input.establishmentCode)
        : await this.findByCredentials(input.email, input.password);

    if (!(await comparePassword(input.password, user.password))) {
      throw new AppError("Incorrect password", 401, "INVALID_PASSWORD");
    }

    if (!user.isActive) {
      throw new AppError("Account is disabled", 403, "ACCOUNT_DISABLED");
    }

    await this.authRepository.updateLastLogin(user.id);

    return this.issueTokens(user);
  }

  private async findInEstablishment(email: string, establishmentCode: string) {
    const establishment = await this.authRepository.findEstablishmentByCode(establishmentCode);

    if (!establishment) {
      throw new AppError(
        "This establishment code does not exist",
        404,
        "ESTABLISHMENT_NOT_FOUND",
      );
    }

    const user = await this.authRepository.findByEmailAndEstablishmentCode(
      email,
      establishmentCode,
    );

    if (!user) {
      throw new AppError(
        "No account with this email in this establishment",
        404,
        "USER_NOT_IN_ESTABLISHMENT",
      );
    }

    return user;
  }

  /**
   * Sans code fourni, on départage sur le mot de passe : tant qu'un seul compte
   * répond, l'établissement est déduit. On ne révèle la liste des écoles que si
   * les identifiants sont valides dans plusieurs d'entre elles.
   */
  private async findByCredentials(email: string, password: string) {
    const candidates = await this.authRepository.findManyByEmail(email);

    if (candidates.length === 0) {
      throw new AppError("No account with this email", 404, "USER_NOT_FOUND");
    }

    if (candidates.length === 1) {
      return candidates[0]!;
    }

    const matching: typeof candidates = [];

    for (const candidate of candidates) {
      if (await comparePassword(password, candidate.password)) {
        matching.push(candidate);
      }
    }

    if (matching.length === 0) {
      throw new AppError("Incorrect password", 401, "INVALID_PASSWORD");
    }

    if (matching.length === 1) {
      return matching[0]!;
    }

    throw new AppError(
      "This account exists in several establishments: please provide your establishment code",
      409,
      "ESTABLISHMENT_REQUIRED",
      {
        establishments: matching.map((candidate) => ({
          code: candidate.establishment.code,
          name: candidate.establishment.name,
        })),
      },
    );
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
