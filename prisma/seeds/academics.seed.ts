import type {
  Class,
  ClassSubject,
  Establishment,
  Evaluation,
  Period,
  ReportCard,
  Student,
  Subject,
  Teacher,
} from "../../src/generated/prisma/client.js";
import {
  AttendanceStatus,
  EvaluationType,
  SanctionType,
} from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

import type { OrganizationSeedResult } from "./organization.seed.js";

const hash = (input: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const seededScore = (seedKey: string): number => 8 + (hash(seedKey) % 24) / 2;

export async function seedAcademics(
  establishments: Establishment[],
  organizations: OrganizationSeedResult[],
) {
  for (const establishment of establishments) {
    const organization = organizations.find((o) => o.establishmentId === establishment.id);
    if (!organization) {
      continue;
    }

    const subjects = await prisma.subject.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { code: "asc" },
    });
    const teachers = await prisma.teacher.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { employeeNumber: "asc" },
    });
    const academicYears = await prisma.academicYear.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { startDate: "asc" },
    });
    const classes = organization.classes;

    for (const [classIndex, schoolClass] of classes.entries()) {
      for (const [subjectIndex, subject] of subjects.entries()) {
        const teacher = teachers[(subjectIndex + classIndex) % teachers.length];
        if (!teacher) {
          continue;
        }

        for (const year of academicYears) {
          const coefficient = 1 + ((subjectIndex + classIndex) % 3);
          const hoursPerWeek = 2 + ((subjectIndex * 3 + classIndex) % 4);

          await prisma.classSubject.upsert({
            where: {
              classId_subjectId_academicYearId: {
                classId: schoolClass.id,
                subjectId: subject.id,
                academicYearId: year.id,
              },
            },
            update: { teacherId: teacher.id, coefficient, hoursPerWeek },
            create: {
              classId: schoolClass.id,
              subjectId: subject.id,
              teacherId: teacher.id,
              academicYearId: year.id,
              coefficient,
              hoursPerWeek,
            },
          });
        }
      }
    }

    const currentYear = academicYears.find((year) => year.isCurrent);

    if (currentYear) {
      await seedTimetables(currentYear.id);
    }

    for (const year of academicYears) {
      await seedEvaluationsAndReportCards(year, classes, subjects);
    }

    if (currentYear) {
      await seedAttendanceAndDiscipline(currentYear, establishment.id);
    }
  }
}

async function seedTimetables(academicYearId: number) {
  const classSubjects = await prisma.classSubject.findMany({
    where: { academicYearId },
    include: { class: { include: { classroom: true } } },
    orderBy: { id: "asc" },
  });

  for (const [index, classSubject] of classSubjects.entries()) {
    const classroom = classSubject.class.classroom;
    if (!classroom) {
      continue;
    }

    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
    const dayOfWeek = days[index % 5]!;
    const startHour = 7 + (index % 8);
    const startTime = new Date(Date.UTC(2000, 0, 1, startHour, 0, 0));
    const endTime = new Date(Date.UTC(2000, 0, 1, startHour + 1, 0, 0));

    const existing = await prisma.timetable.findFirst({
      where: { classSubjectId: classSubject.id, classroomId: classroom.id, dayOfWeek, startTime },
    });

    if (!existing) {
      await prisma.timetable.create({
        data: { classSubjectId: classSubject.id, classroomId: classroom.id, dayOfWeek, startTime, endTime },
      });
    }
  }
}

async function seedEvaluationsAndReportCards(
  year: { id: number; name: string; isCurrent: boolean },
  classes: Class[],
  subjects: Subject[],
) {
const periods = await prisma.period.findMany({
      where: { academicYearId: year.id },
      orderBy: { order: "asc" },
    });

    const targetClasses: Class[] = year.isCurrent ? classes : [classes[0]!];
    const classesToSeed = targetClasses.filter(Boolean);

    for (const schoolClass of classesToSeed) {
      const classSubjects = await prisma.classSubject.findMany({
        where: { academicYearId: year.id, classId: schoolClass.id },
        include: { subject: true },
        orderBy: { id: "asc" },
      });

      const enrollments = await prisma.enrollment.findMany({
        where: { academicYearId: year.id, classId: schoolClass.id },
        include: { student: true },
      });
      const students = enrollments.map((e) => e.student);

      for (const period of periods) {
        // Évaluations + notes.
        for (const [subjectIndex, classSubject] of classSubjects.entries()) {
          const subjectName = subjectNameOf(classSubject, subjects);
          const isExam = period.order === 3;
          const title = isExam
            ? `Composition ${period.name} – ${subjectName}`
            : `Devoir ${period.order} – ${subjectName}`;
          const type = isExam ? EvaluationType.EXAM : EvaluationType.TEST;

          const evaluation = await findOrCreateEvaluation(classSubject, period, title, type);

          for (const student of students) {
            const score = seededScore(`${year.name}-${schoolClass.code}-${subjectIndex}-${student.studentNumber}-${period.order}`);

            await prisma.grade.upsert({
              where: { evaluationId_studentId: { evaluationId: evaluation.id, studentId: student.id } },
              update: { score, isAbsent: false },
              create: {
                evaluationId: evaluation.id,
                studentId: student.id,
                score,
                isAbsent: hash(`${evaluation.id}-${student.id}`) % 25 === 0,
                comment: score >= 15 ? "Très bon travail" : score >= 10 ? "Peut mieux faire" : "Encouragements nécessaires",
              },
            });
          }
        }

        // Bulletins : moyenne pondérée + classement dans la classe.
        const rated = students
          .map((student) => ({
            student,
            average: computeWeightedAverage(year.name, schoolClass.code, student, classSubjects, period.order),
          }))
          .sort((a, b) => b.average - a.average);

        for (const [rankIndex, entry] of rated.entries()) {
          const reportCard = await upsertReportCard(entry.student, period, schoolClass, entry.average, rankIndex + 1);

          for (const [subjectIndex, classSubject] of classSubjects.entries()) {
            const average = seededScore(`${year.name}-${schoolClass.code}-${subjectIndex}-${entry.student.studentNumber}-${period.order}`);

            await prisma.reportCardLine.upsert({
              where: {
                reportCardId_subjectId: {
                  reportCardId: reportCard.id,
                  subjectId: classSubject.subjectId,
                },
              },
              update: {
                average,
                coefficient: classSubject.coefficient,
                rank: rankIndex + 1,
                teacherComment: teacherComment(average),
              },
              create: {
                reportCardId: reportCard.id,
                subjectId: classSubject.subjectId,
                average,
                coefficient: classSubject.coefficient,
                rank: rankIndex + 1,
                teacherComment: teacherComment(average),
},
            });
          }
        }
      }
    }
}

async function seedAttendanceAndDiscipline(year: { id: number; startDate: Date }, establishmentId: number) {
  const recorder = await findRecorderUser(establishmentId);
  if (!recorder) {
    return;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { academicYearId: year.id },
    include: { class: true, student: true },
    orderBy: { id: "asc" },
  });

  const attendanceDate = new Date(year.startDate.getFullYear(), 9, 5);
  for (const [index, enrollment] of enrollments.entries()) {
    const status =
      index % 15 === 0
        ? AttendanceStatus.ABSENT
        : index % 9 === 0
          ? AttendanceStatus.LATE
          : index % 12 === 0
            ? AttendanceStatus.EXCUSED
            : AttendanceStatus.PRESENT;

    const existing = await prisma.attendance.findFirst({
      where: { studentId: enrollment.studentId, classId: enrollment.classId, date: attendanceDate },
    });

    if (!existing) {
      await prisma.attendance.create({
        data: {
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          date: attendanceDate,
          status,
          ...(status === AttendanceStatus.ABSENT ? { justification: "Maladie" } : {}),
          recordedById: recorder.id,
        },
      });
    }
  }

  const flagged = enrollments.filter((e, index) => index % 7 === 2 && e.student && e.class);
  for (const [index, enrollment] of flagged.entries()) {
    const type = index % 3 === 0 ? SanctionType.WARNING : SanctionType.REPRIMAND;
    const date = new Date(year.startDate.getFullYear(), 9, 15 + (index % 5));

    const existing = await prisma.disciplineRecord.findFirst({
      where: { studentId: enrollment.studentId, date, reason: "Retard répété en classe" },
    });

    if (!existing) {
      await prisma.disciplineRecord.create({
        data: {
          studentId: enrollment.studentId,
          type,
          reason: "Retard répété en classe",
          date,
          description: "Avertissement oral puis écrit pour retards répétés.",
          issuedById: recorder.id,
        },
      });
    }
  }
}

function subjectNameOf(classSubject: ClassSubject, subjects: Subject[]): string {
  return subjects.find((s) => s.id === classSubject.subjectId)?.name ?? "Matière";
}

async function findOrCreateEvaluation(
  classSubject: ClassSubject,
  period: Period,
  title: string,
  type: EvaluationType,
): Promise<Evaluation> {
  const existing = await prisma.evaluation.findFirst({
    where: { classSubjectId: classSubject.id, periodId: period.id, title },
  });

  if (existing) {
    return existing;
  }

  const date = new Date(period.startDate.getTime() + 15 * 24 * 60 * 60 * 1000);

  return prisma.evaluation.create({
    data: {
      classSubjectId: classSubject.id,
      periodId: period.id,
      title,
      type,
      date,
      maxScore: 20,
      coefficient: classSubject.coefficient,
    },
  });
}

function computeWeightedAverage(
  yearName: string,
  classCode: string,
  student: Student,
  classSubjects: ClassSubject[],
  periodOrder: number,
): number {
  const total = classSubjects.reduce((acc, classSubject, subjectIndex) => {
    const score = seededScore(`${yearName}-${classCode}-${subjectIndex}-${student.studentNumber}-${periodOrder}`);
    return acc + score * (classSubject.coefficient ?? 1);
  }, 0);

  const divisor = classSubjects.reduce((acc, classSubject) => acc + (classSubject.coefficient ?? 1), 0);

  return divisor === 0 ? 10 : Number((total / divisor).toFixed(2));
}

async function upsertReportCard(
  student: Student,
  period: Period,
  schoolClass: Class,
  average: number,
  rank: number,
): Promise<ReportCard> {
  const appreciation =
    average >= 15
      ? "Élève brillant, très bon trimestre."
      : average >= 12
        ? "Bon trimestre, à encourager."
        : "Trimestre moyen, des efforts restent à fournir.";

  return prisma.reportCard.upsert({
    where: { studentId_periodId: { studentId: student.id, periodId: period.id } },
    update: {
      classId: schoolClass.id,
      generalAverage: average,
      rank,
      conduct: "Bien",
      publishedAt: new Date(period.endDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      appreciation,
    },
    create: {
      studentId: student.id,
      periodId: period.id,
      classId: schoolClass.id,
      generalAverage: average,
      rank,
      conduct: "Bien",
      publishedAt: new Date(period.endDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      appreciation,
    },
  });
}

function teacherComment(average: number): string {
  return average >= 15 ? "Excellent" : average >= 12 ? "Bien" : "Doit fournir davantage d'efforts";
}

async function findRecorderUser(establishmentId: number) {
  const user = await prisma.user.findFirst({
    where: { establishmentId, isActive: true, role: { name: "ENSEIGNANT" } },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  return user ?? null;
}