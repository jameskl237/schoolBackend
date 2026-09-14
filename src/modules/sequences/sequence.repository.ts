import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const sequenceInclude = {
  period: {
    select: {
      id: true,
      name: true,
      order: true,
      academicYear: { select: { id: true, name: true, isCurrent: true } },
    },
  },
  _count: { select: { evaluations: true } },
} satisfies Prisma.SequenceInclude;

export interface SequenceFilters {
  periodId?: number;
  academicYearId?: number;
}

export class SequenceRepository {
  findMany(establishmentId: number, filters: SequenceFilters = {}) {
    return prisma.sequence.findMany({
      where: {
        period: {
          academicYear: { establishmentId },
          ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        },
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
      },
      include: sequenceInclude,
      orderBy: [{ period: { order: "asc" } }, { order: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.sequence.findFirst({
      where: { id, period: { academicYear: { establishmentId } } },
      include: sequenceInclude,
    });
  }

  create(data: Prisma.SequenceCreateInput) {
    return prisma.sequence.create({ data, include: sequenceInclude });
  }

  update(id: number, data: Prisma.SequenceUpdateInput) {
    return prisma.sequence.update({ where: { id }, data, include: sequenceInclude });
  }

  delete(id: number) {
    return prisma.sequence.delete({ where: { id } });
  }
}
