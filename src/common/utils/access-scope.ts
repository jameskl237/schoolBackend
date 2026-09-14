import type { Request } from "express";

import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";

/**
 * Le périmètre de l'utilisateur courant : ses permissions, plus l'identité
 * applicative de son compte (enseignant, élève, parent, tuteur).
 *
 * Deux niveaux de lecture cohabitent dans le modèle de permissions :
 * - `<domaine>.all` donne la vision globale de l'établissement (direction,
 *   secrétariat, comptabilité, infirmerie...) ;
 * - `<domaine>.view` seul restreint aux données que l'identité du compte
 *   autorise : ses classes pour un enseignant, lui-même pour un élève, ses
 *   enfants pour un parent.
 */
export interface AccessScope {
  userId: number;
  establishmentId: number;
  permissions: string[];
  teacherId?: number;
  studentId?: number;
  parentId?: number;
  guardianId?: number;
}

export const getScope = (req: Request): AccessScope => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  const { id, establishmentId, permissions, teacherId, studentId, parentId, guardianId } = req.user;

  return {
    userId: id,
    establishmentId,
    permissions,
    ...(teacherId !== undefined ? { teacherId } : {}),
    ...(studentId !== undefined ? { studentId } : {}),
    ...(parentId !== undefined ? { parentId } : {}),
    ...(guardianId !== undefined ? { guardianId } : {}),
  };
};

export const can = (scope: AccessScope, ...permissions: string[]): boolean =>
  permissions.some((permission) => scope.permissions.includes(permission));

/** Un compte sans identité ni vision globale ne doit rien voir — surtout pas tout. */
const MATCH_NOTHING: Prisma.StudentWhereInput = { id: { lt: 0 } };

/**
 * Restreint une requête sur les élèves au périmètre de l'utilisateur.
 * À composer avec le filtre d'établissement, jamais à utiliser seul.
 *
 * `academicYearId` corrèle les deux bouts du périmètre enseignant : l'élève doit
 * être inscrit cette année-là dans une classe dont l'enseignant tient une matière
 * cette même année. Sans lui, un enseignant verrait encore les élèves d'une classe
 * qu'il ne tient plus.
 */
export const studentScopeFilter = (
  scope: AccessScope,
  academicYearId?: number,
): Prisma.StudentWhereInput => {
  if (can(scope, "students.view.all", "students.manage")) {
    return {};
  }

  if (scope.studentId !== undefined) {
    return { id: scope.studentId };
  }

  if (scope.teacherId !== undefined) {
    return {
      enrollments: {
        some: {
          ...(academicYearId !== undefined ? { academicYearId } : {}),
          class: {
            classSubjects: {
              some: {
                teacherId: scope.teacherId,
                ...(academicYearId !== undefined ? { academicYearId } : {}),
              },
            },
          },
        },
      },
    };
  }

  if (scope.parentId !== undefined) {
    return { studentParents: { some: { parentId: scope.parentId } } };
  }

  if (scope.guardianId !== undefined) {
    return { studentGuardians: { some: { guardianId: scope.guardianId } } };
  }

  return MATCH_NOTHING;
};
