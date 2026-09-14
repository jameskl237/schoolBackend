type WithoutUndefined<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };

/**
 * Drops keys whose value is `undefined`. Needed before passing a parsed Zod `.optional()`
 * object to Prisma: with `exactOptionalPropertyTypes` on, `{ key: undefined }` is not the
 * same type as an absent key, and Prisma's generated *UpdateInput types require the latter.
 */
export function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<WithoutUndefined<T>> {
  const result: Partial<WithoutUndefined<T>> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}
