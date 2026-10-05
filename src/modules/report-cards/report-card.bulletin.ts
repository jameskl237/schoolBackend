import { AppError } from "../../common/errors/app-error.js";
import { can, type AccessScope } from "../../common/utils/access-scope.js";
import { prisma } from "../../infrastructure/database/prisma.js";

/**
 * Assemble tout ce qu'exige un bulletin camerounais : l'en-tête officiel de
 * l'établissement, l'identité de l'élève, ses notes par matière avec le nom de
 * l'enseignant, et les statistiques de la classe qui situent l'élève.
 *
 * Les moyennes de classe ne sont pas stockées : elles se déduisent des bulletins
 * de la même classe pour la même période, donc restent justes après coup.
 */
export interface BulletinSubjectLine {
  subjectId: number;
  subject: string;
  average: number | null;
  coefficient: number;
  /** Note × coefficient, ce que le format camerounais appelle « total ». */
  total: number | null;
  rank: number | null;
  teacherComment: string | null;
  teacherName: string | null;
}

export interface Bulletin {
  establishment: {
    name: string;
    code: string;
    logoUrl: string | null;
    city: string | null;
    poBox: string | null;
    phone: string | null;
  };
  academicYear: string;
  period: { name: string; order: number };
  student: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    dateOfBirth: string;
    placeOfBirth: string | null;
    gender: string;
    photoUrl: string | null;
    repeating: boolean;
  };
  className: string;
  headTeacher: string | null;
  lines: BulletinSubjectLine[];
  totals: { points: number; coefficients: number; average: number | null; rank: number | null };
  classStats: {
    size: number;
    average: number | null;
    highestAverage: number | null;
    lowestAverage: number | null;
  };
  conduct: string | null;
  appreciation: string | null;
  absences: { count: number; justified: number; late: number };
  publishedAt: string | null;
}

export class BulletinBuilder {
  /** Le bulletin complet, sous réserve que l'appelant ait le droit de le voir. */
  async build(reportCardId: number, scope: AccessScope): Promise<Bulletin> {
    const reportCard = await prisma.reportCard.findFirst({
      where: { id: reportCardId, student: { establishmentId: scope.establishmentId } },
      include: {
        student: { include: { establishment: true } },
        period: { include: { academicYear: true } },
        class: { include: { mainTeacher: true } },
        lines: { include: { subject: true }, orderBy: { subject: { name: "asc" } } },
      },
    });

    if (!reportCard) {
      throw new AppError("Report card not found", 404, "REPORT_CARD_NOT_FOUND");
    }

    await this.ensureVisible(reportCard, scope);

    const [classSubjects, siblings, enrollment, attendances] = await Promise.all([
      prisma.classSubject.findMany({
        where: { classId: reportCard.classId, academicYearId: reportCard.period.academicYearId },
        include: { teacher: true },
      }),
      prisma.reportCard.findMany({
        where: { classId: reportCard.classId, periodId: reportCard.periodId },
        select: { generalAverage: true },
      }),
      prisma.enrollment.findFirst({
        where: { studentId: reportCard.studentId, academicYearId: reportCard.period.academicYearId },
        select: { status: true },
      }),
      prisma.attendance.findMany({
        where: {
          studentId: reportCard.studentId,
          date: { gte: reportCard.period.startDate, lte: reportCard.period.endDate },
        },
        select: { status: true },
      }),
    ]);

    const teacherBySubject = new Map(
      classSubjects.map((item) => [
        item.subjectId,
        `${item.teacher.firstName} ${item.teacher.lastName}`,
      ]),
    );

    const lines: BulletinSubjectLine[] = reportCard.lines.map((line) => ({
      subjectId: line.subjectId,
      subject: line.subject.name,
      average: line.average,
      coefficient: line.coefficient,
      total: line.average === null ? null : round(line.average * line.coefficient),
      rank: line.rank,
      teacherComment: line.teacherComment,
      teacherName: teacherBySubject.get(line.subjectId) ?? null,
    }));

    const coefficients = lines.reduce((sum, line) => sum + line.coefficient, 0);
    const points = lines.reduce((sum, line) => sum + (line.total ?? 0), 0);
    const scored = siblings
      .map((entry) => entry.generalAverage)
      .filter((value): value is number => value !== null);

    return {
      establishment: {
        name: reportCard.student.establishment.name,
        code: reportCard.student.establishment.code,
        logoUrl: reportCard.student.establishment.logoUrl,
        city: reportCard.student.establishment.city,
        poBox: reportCard.student.establishment.poBox,
        phone: reportCard.student.establishment.phone,
      },
      academicYear: reportCard.period.academicYear.name,
      period: { name: reportCard.period.name, order: reportCard.period.order },
      student: {
        firstName: reportCard.student.firstName,
        lastName: reportCard.student.lastName,
        studentNumber: reportCard.student.studentNumber,
        dateOfBirth: reportCard.student.dateOfBirth.toISOString(),
        placeOfBirth: reportCard.student.placeOfBirth,
        gender: reportCard.student.gender,
        photoUrl: reportCard.student.photoUrl,
        repeating: enrollment?.status === "REPEATING",
      },
      className: reportCard.class.name,
      headTeacher: reportCard.class.mainTeacher
        ? `${reportCard.class.mainTeacher.firstName} ${reportCard.class.mainTeacher.lastName}`
        : null,
      lines,
      totals: {
        points: round(points),
        coefficients: round(coefficients),
        average: reportCard.generalAverage ?? (coefficients > 0 ? round(points / coefficients) : null),
        rank: reportCard.rank,
      },
      classStats: {
        size: siblings.length,
        average: scored.length > 0 ? round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
        highestAverage: scored.length > 0 ? round(Math.max(...scored)) : null,
        lowestAverage: scored.length > 0 ? round(Math.min(...scored)) : null,
      },
      conduct: reportCard.conduct,
      appreciation: reportCard.appreciation,
      absences: {
        count: attendances.filter((a) => a.status === "ABSENT").length,
        justified: attendances.filter((a) => a.status === "EXCUSED").length,
        late: attendances.filter((a) => a.status === "LATE").length,
      },
      publishedAt: reportCard.publishedAt?.toISOString() ?? null,
    };
  }

  /** Mêmes règles que la liste : la famille ne voit que les bulletins publiés. */
  private async ensureVisible(
    reportCard: { studentId: number; publishedAt: Date | null },
    scope: AccessScope,
  ) {
    if (can(scope, "students.view.all", "report-cards.manage")) {
      return;
    }

    const isPublished = reportCard.publishedAt !== null;

    if (scope.studentId !== undefined && scope.studentId === reportCard.studentId && isPublished) {
      return;
    }

    if (scope.parentId !== undefined && isPublished) {
      const link = await prisma.studentParent.findFirst({
        where: { parentId: scope.parentId, studentId: reportCard.studentId },
        select: { id: true },
      });

      if (link) {
        return;
      }
    }

    throw new AppError("Report card not found", 404, "REPORT_CARD_NOT_FOUND");
  }
}

const round = (value: number) => Math.round(value * 100) / 100;
