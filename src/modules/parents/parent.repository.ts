import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const parentInclude = {
  studentParents: {
    select: {
      relationType: true,
      isPrimaryContact: true,
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
    },
  },
} satisfies Prisma.ParentInclude;

export class ParentRepository {
  findMany(establishmentId: number) {
    return prisma.parent.findMany({
      where: { establishmentId },
      include: parentInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.parent.findFirst({ where: { id, establishmentId }, include: parentInclude });
  }

  create(data: Prisma.ParentCreateInput) {
    return prisma.parent.create({ data, include: parentInclude });
  }

  update(id: number, data: Prisma.ParentUpdateInput) {
    return prisma.parent.update({ where: { id }, data, include: parentInclude });
  }

  delete(id: number) {
    return prisma.parent.delete({ where: { id } });
  }

  /** Replaces a parent's student links with exactly the given set. */
  setStudentLinks(
    parentId: number,
    links: { studentId: number; relationType: string; isPrimaryContact?: boolean | undefined }[],
  ) {
    return prisma.$transaction([
      prisma.studentParent.deleteMany({ where: { parentId } }),
      ...(links.length > 0
        ? [
            prisma.studentParent.createMany({
              data: links.map((link) => ({
                parentId,
                studentId: link.studentId,
                relationType: link.relationType as Prisma.StudentParentCreateManyInput["relationType"],
                isPrimaryContact: link.isPrimaryContact ?? false,
              })),
            }),
          ]
        : []),
    ]);
  }
}
