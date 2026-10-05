import { prisma } from "../../infrastructure/database/prisma.js";

export class DashboardRepository {
  async getStats(establishmentId: number) {
    const [establishment, userCount, studentCount, teacherCount, classroomCount, currentYear] =
      await Promise.all([
        prisma.establishment.findUnique({
          where: { id: establishmentId },
          select: { name: true, code: true, type: true },
        }),
        prisma.user.count({ where: { establishmentId } }),
        prisma.student.count({ where: { establishmentId } }),
        prisma.teacher.count({ where: { establishmentId } }),
        prisma.classroom.count({ where: { establishmentId } }),
        prisma.academicYear.findFirst({
          where: { establishmentId, isCurrent: true },
          select: { id: true, name: true, startDate: true, endDate: true },
        }),
      ]);

    return { establishment, userCount, studentCount, teacherCount, classroomCount, currentYear };
  }

  async getUserCountByRole(establishmentId: number) {
    const roles = await prisma.role.findMany({
      where: { establishmentId },
      select: { name: true, _count: { select: { users: true } } },
    });

    return roles.map((role) => ({ role: role.name, count: role._count.users }));
  }
}
