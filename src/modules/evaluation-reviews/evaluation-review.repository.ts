import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const reviewInclude = {
  author: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.EvaluationReviewInclude;

export class EvaluationReviewRepository {
  findByEvaluation(evaluationId: number) {
    return prisma.evaluationReview.findMany({
      where: { evaluationId },
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: number) {
    return prisma.evaluationReview.findUnique({ where: { id }, include: reviewInclude });
  }

  create(data: Prisma.EvaluationReviewUncheckedCreateInput) {
    return prisma.evaluationReview.create({ data, include: reviewInclude });
  }

  resolve(id: number) {
    return prisma.evaluationReview.update({
      where: { id },
      data: { resolvedAt: new Date() },
      include: reviewInclude,
    });
  }
}
