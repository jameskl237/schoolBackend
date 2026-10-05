import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const studentSelect = {
  id: true,
  firstName: true,
  lastName: true,
  studentNumber: true,
  dateOfBirth: true,
} satisfies Prisma.StudentSelect;

const recordInclude = {
  student: { select: studentSelect },
  vaccinations: { orderBy: { date: "desc" } },
} satisfies Prisma.MedicalRecordInclude;

const visitInclude = {
  student: { select: studentSelect },
  handledBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.InfirmaryVisitInclude;

export class HealthRecordRepository {
  findRecords(establishmentId: number) {
    return prisma.medicalRecord.findMany({
      where: { student: { establishmentId } },
      include: recordInclude,
      orderBy: { student: { lastName: "asc" } },
    });
  }

  findRecordByStudent(studentId: number, establishmentId: number) {
    return prisma.medicalRecord.findFirst({
      where: { studentId, student: { establishmentId } },
      include: recordInclude,
    });
  }

  /** Le dossier naît à la première saisie : pas besoin de le créer d'avance. */
  upsertRecord(studentId: number, data: Prisma.MedicalRecordUpdateInput) {
    return prisma.medicalRecord.upsert({
      where: { studentId },
      update: data,
      create: { ...(data as Prisma.MedicalRecordCreateInput), student: { connect: { id: studentId } } },
      include: recordInclude,
    });
  }

  findVaccination(id: number, establishmentId: number) {
    return prisma.vaccination.findFirst({
      where: { id, medicalRecord: { student: { establishmentId } } },
    });
  }

  createVaccination(data: Prisma.VaccinationUncheckedCreateInput) {
    return prisma.vaccination.create({ data });
  }

  updateVaccination(id: number, data: Prisma.VaccinationUpdateInput) {
    return prisma.vaccination.update({ where: { id }, data });
  }

  deleteVaccination(id: number) {
    return prisma.vaccination.delete({ where: { id } });
  }

  findVisits(establishmentId: number, studentId?: number) {
    return prisma.infirmaryVisit.findMany({
      where: { student: { establishmentId }, ...(studentId ? { studentId } : {}) },
      include: visitInclude,
      orderBy: { date: "desc" },
      take: 200,
    });
  }

  findVisit(id: number, establishmentId: number) {
    return prisma.infirmaryVisit.findFirst({
      where: { id, student: { establishmentId } },
      include: visitInclude,
    });
  }

  createVisit(data: Prisma.InfirmaryVisitUncheckedCreateInput) {
    return prisma.infirmaryVisit.create({ data, include: visitInclude });
  }

  updateVisit(id: number, data: Prisma.InfirmaryVisitUpdateInput) {
    return prisma.infirmaryVisit.update({ where: { id }, data, include: visitInclude });
  }

  deleteVisit(id: number) {
    return prisma.infirmaryVisit.delete({ where: { id } });
  }
}
