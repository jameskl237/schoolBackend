import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class SubjectRepository {
  findMany(establishmentId: number) {
    return prisma.subject.findMany({ where: { establishmentId }, orderBy: { name: "asc" } });
  }

  findById(id: number, establishmentId: number) {
    return prisma.subject.findFirst({ where: { id, establishmentId } });
  }

  create(data: Prisma.SubjectCreateInput) {
    return prisma.subject.create({ data });
  }

  update(id: number, data: Prisma.SubjectUpdateInput) {
    return prisma.subject.update({ where: { id }, data });
  }

  delete(id: number) {
    return prisma.subject.delete({ where: { id } });
  }
}
