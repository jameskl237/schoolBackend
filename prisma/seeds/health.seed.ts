import type { Establishment } from "../../src/generated/prisma/client.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

const VACCINES = ["BCG", "DTP", "Polio", "Rougeole", "Hépatite B", "Fièvre jaune"];

export async function seedHealth(establishments: Establishment[]) {
  for (const establishment of establishments) {
    const students = await prisma.student.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { id: "asc" },
    });

    const nurse = await prisma.user.findFirst({
      where: { establishmentId: establishment.id, isActive: true, role: { name: "INFIRMIER" } },
      orderBy: { id: "asc" },
      select: { id: true },
    });

    for (const [index, student] of students.entries()) {
      const hasRecord = index % 2 === 0;

      if (hasRecord) {
        const medicalRecord = await prisma.medicalRecord.upsert({
          where: { studentId: student.id },
          update: {},
          create: {
            studentId: student.id,
            bloodGroup: ["A+", "O+", "B+", "AB+", "O-"][index % 5],
            allergies: index % 3 === 0 ? "Allergie aux arachides" : null,
            chronicConditions: index % 5 === 0 ? "Asthme léger" : null,
            emergencyContact: `+237 6${["5", "7", "9"][index % 3]}${String(700000 + index).slice(-6)}`,
            doctorName: `Dr ${["Ngono", "Fouda", "Essomba", "Talla"][index % 4]}`,
            doctorPhone: `+237 6${["6", "8"][index % 2]}${String(800000 + index).slice(-6)}`,
            insuranceNumber: `ASS-${student.studentNumber.replace("E-", "")}`,
            notes: index % 4 === 0 ? "Suivi médical annuel recommandé." : null,
          },
        });

        const vaccineCount = 2 + (index % 3);
        for (let v = 0; v < vaccineCount; v += 1) {
          const name = VACCINES[(index + v) % VACCINES.length]!;
          const date = new Date(2016 + (v % 5), v % 12, 5 + (index % 20));

          const existing = await prisma.vaccination.findFirst({
            where: { medicalRecordId: medicalRecord.id, name, date },
          });

          if (!existing) {
            await prisma.vaccination.create({
              data: {
                medicalRecordId: medicalRecord.id,
                name,
                date,
                nextDueDate: v % 2 === 0 ? new Date(date.getFullYear() + 5, date.getMonth(), date.getDate()) : null,
              },
            });
          }
        }
      }

      if (nurse && index % 3 === 0) {
        const date = new Date(2026, 9, 3 + (index % 15));
        const reason = ["Maux de tête", "Fièvre légère", "Blessure au genou", "Toux persistante", "Crise d'asthme"][index % 5]!;

        const existing = await prisma.infirmaryVisit.findFirst({
          where: { studentId: student.id, date, reason },
        });

        if (!existing) {
          await prisma.infirmaryVisit.create({
            data: {
              studentId: student.id,
              date,
              reason,
              treatment: ["Paracétamol", "Pansement et antiseptique", "Repos et hydratation", "Ventoline"][index % 4],
              temperature: 36.5 + ((index % 20) / 10),
              notifiedParent: index % 2 === 0,
              handledById: nurse.id,
            },
          });
        }
      }
    }
  }
}