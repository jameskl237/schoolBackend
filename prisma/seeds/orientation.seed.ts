import type { Establishment } from "../../src/generated/prisma/client.js";
import { OrientationStatus } from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

export async function seedOrientation(establishments: Establishment[]) {
  for (const establishment of establishments) {
    const currentYear = await prisma.academicYear.findFirst({
      where: { establishmentId: establishment.id, isCurrent: true },
    });
    if (!currentYear) {
      continue;
    }

    const counselor = await prisma.user.findFirst({
      where: {
        establishmentId: establishment.id,
        isActive: true,
        userRoles: { some: { role: { name: "CONSEILLER_ORIENTATION" } } },
      },
      orderBy: { id: "asc" },
      select: { id: true },
    });

    const fallbackUser =
      counselor ??
      (await prisma.user.findFirst({
        where: { establishmentId: establishment.id, isActive: true },
        orderBy: { id: "asc" },
        select: { id: true },
      }));

    const enrollments = await prisma.enrollment.findMany({
      where: { academicYearId: currentYear.id },
      include: { student: true },
      orderBy: { id: "asc" },
    });

    const selected = enrollments.filter((_, index) => index % 3 === 0).slice(0, 8);
    const tracks = ["Scientifique", "Littéraire", "Arts et Sciences Humaines", "Industriel ou Commerce"];

    for (const [index, enrollment] of selected.entries()) {
      if (!enrollment.student) {
        continue;
      }

      const status =
        index % 3 === 0 ? OrientationStatus.VALIDATED : index % 3 === 1 ? OrientationStatus.PENDING : OrientationStatus.REJECTED;
      const recommendedTrack = tracks[index % tracks.length]!;

      const record = await prisma.orientationRecord.upsert({
        where: {
          studentId_academicYearId: { studentId: enrollment.studentId, academicYearId: currentYear.id },
        },
        update: {
          recommendedTrack,
          finalDecision: status === OrientationStatus.VALIDATED ? recommendedTrack : null,
          status,
        },
        create: {
          studentId: enrollment.studentId,
          academicYearId: currentYear.id,
          recommendedTrack,
          finalDecision: status === OrientationStatus.VALIDATED ? recommendedTrack : null,
          status,
        },
      });

      if (fallbackUser && index % 2 === 0) {
        const date = new Date(currentYear.startDate.getFullYear(), 9, 20 + (index % 10));
        const existing = await prisma.counselingSession.findFirst({
          where: { orientationRecordId: record.id, date },
        });

        if (!existing) {
          await prisma.counselingSession.create({
            data: {
              orientationRecordId: record.id,
              counselorId: fallbackUser.id,
              date,
              notes: "Entretien d'orientation avec l'élève et ses parents.",
              followUpDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
  }
}