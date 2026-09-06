import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

export interface AccessTokenPayload {
  sub: number;
  email: string;
  establishmentId: number;
}

export interface RefreshTokenPayload {
  sub: number;
}

type ExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as ExpiresIn,
  });

export const signRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as ExpiresIn,
  });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as RefreshTokenPayload;
