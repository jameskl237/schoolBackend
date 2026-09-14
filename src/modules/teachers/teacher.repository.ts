import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const teacherInclude = {
  user: { select: { id: true, email: true, isActive: true } },
  classSubjects: {
    select: {
      id: true,
      coefficient: true,
      hoursPerWeek: true,
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true, code: true, gradeLevelId: true } },
      academicYear: { select: { id: true, name: true, isCurrent: true } },
    },
  },
} satisfies Prisma.TeacherInclude;

export class TeacherRepository {
  findMany(establishmentId: number) {
    return prisma.teacher.findMany({
      where: { establishmentId },
      include: teacherInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.teacher.findFirst({ where: { id, establishmentId }, include: teacherInclude });
  }

  create(data: Prisma.TeacherCreateInput) {
    return prisma.teacher.create({ data, include: teacherInclude });
  }

  update(id: number, data: Prisma.TeacherUpdateInput) {
    return prisma.teacher.update({ where: { id }, data, include: teacherInclude });
  }

  delete(id: number) {
    return prisma.teacher.delete({ where: { id } });
  }
}
