import { prisma } from "../../infrastructure/database/prisma.js";

import type { AccessScope } from "./access-scope.js";

/**
 * Les classes dont l'utilisateur est professeur principal.
 *
 * Le professeur principal voit les notes de toutes les matières de sa classe et
 * peut les viser, mais il ne les saisit pas : la saisie reste à l'enseignant de
 * la matière. C'est la seule dérogation au cloisonnement par affectation.
 */
export const findMainTeacherClassIds = async (scope: AccessScope): Promise<number[]> => {
  if (scope.teacherId === undefined) {
    return [];
  }

  const classes = await prisma.class.findMany({
    where: {
      mainTeacherId: scope.teacherId,
      gradeLevel: { cycle: { section: { schoolLevel: { establishmentId: scope.establishmentId } } } },
    },
    select: { id: true },
  });

  return classes.map((classEntity) => classEntity.id);
};

/** Vrai si l'utilisateur est professeur principal de cette classe. */
export const isMainTeacherOf = async (scope: AccessScope, classId: number): Promise<boolean> => {
  if (scope.teacherId === undefined) {
    return false;
  }

  const classEntity = await prisma.class.findFirst({
    where: { id: classId, mainTeacherId: scope.teacherId },
    select: { id: true },
  });

  return classEntity !== null;
};
