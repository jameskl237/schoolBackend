import type {
  Class,
  Establishment,
  Guardian,
  Parent,
  Student,
} from "../../src/generated/prisma/client.js";
import {
  EnrollmentStatus,
  Gender,
  GuardianRelationType,
  ParentRelationType,
  SchoolType,
} from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

import type { OrganizationSeedResult } from "./organization.seed.js";

const FIRST_NAMES = [
  "Jean",
  "Marie",
  "Paul",
  "Christelle",
  "Emmanuel",
  "Sylvie",
  "Blaise",
  "Cécile",
  "André",
  "Aïcha",
  "Serge",
  "Odile",
  "Patrick",
  "Ginette",
  "Hervé",
  "Nadège",
  "Bertrand",
  "Solange",
  "Yannick",
  "Pauline",
];

const LAST_NAMES = [
  "Mballa",
  "Ngono",
  "Fotso",
  "Kamga",
  "Nkolo",
  "Etoundi",
  "Fouda",
  "Tchoua",
  "Nguemo",
  "Talla",
  "Onana",
  "Essomba",
  "Mvondo",
  "Nana",
  "Kenmogne",
  "Ateba",
  "Ndongo",
  "Mbarga",
  "Abena",
  "Biloa",
];

const hash = (input: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const pick = <T>(arr: T[], seed: number): T => arr[seed % arr.length];

export async function seedStudents(
  establishments: Establishment[],
  organizations: OrganizationSeedResult[],
) {
  for (const [estIndex, establishment] of establishments.entries()) {
    const result = organizations.find((o) => o.establishmentId === establishment.id);
    if (!result) {
      continue;
    }

    const classes = result.classes;
    const classCount = classes.length;
    const academicYears = await prisma.academicYear.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { startDate: "asc" },
    });

    const studentCount =
      establishment.type === SchoolType.PRIMARY
        ? 12
        : establishment.type === SchoolType.SECONDARY
          ? 16
          : 24;

    const baseNumber = 1100 + estIndex * 1000;

    const eleveUserIds = await findRoleUserIds(establishment.id, "ELEVE");
    const parentUserIds = await findRoleUserIds(establishment.id, "PARENT");

    const seededStudents: Student[] = [];
    const seededParents: Parent[] = [];

    for (let i = 1; i <= studentCount; i += 1) {
      const studentSeedKey = `${establishment.code}-STUDENT-${i}`;
      const h = hash(studentSeedKey);
      const firstName = pick(FIRST_NAMES, h);
      const lastName = pick(LAST_NAMES, Math.floor(h / FIRST_NAMES.length));
      const gender = h % 2 === 0 ? Gender.MALE : Gender.FEMALE;
      const studentNumber = `E-${baseNumber + i}`;

      const birthYear = establishment.type === SchoolType.SECONDARY ? 2008 + (h % 7) : 2014 + (h % 7);
      const linkedStudentUser = eleveUserIds.shift();

      const student = await prisma.student.upsert({
        where: {
          establishmentId_studentNumber: { establishmentId: establishment.id, studentNumber },
        },
        update: {
          firstName,
          lastName,
          dateOfBirth: new Date(birthYear, h % 12, (h % 27) + 1),
          gender,
          ...(linkedStudentUser !== undefined ? { userId: linkedStudentUser } : {}),
        },
        create: {
          establishmentId: establishment.id,
          studentNumber,
          firstName,
          lastName,
          dateOfBirth: new Date(birthYear, h % 12, (h % 27) + 1),
          placeOfBirth: pick(["Yaoundé", "Douala", "Bafoussam", "Kribi", "Garoua", "Bamenda"], h),
          gender,
          nationality: "Camerounaise",
          address: `Quartier ${pick(["Bastos", "Bonapriso", "Tam-Tam", "Centre administratif"], h)}`,
          ...(linkedStudentUser !== undefined ? { userId: linkedStudentUser } : {}),
        },
      });
      seededStudents.push(student);

      // Parents : père + mère (personas distincts par élève).
      const parentDefs = [
        {
          relation: ParentRelationType.FATHER,
          key: `${studentSeedKey}-FATHER`,
          primary: true,
          occupation: pick(["Commerçant", "Fonctionnaire", "Enseignant", "Ingénieur", "Infirmier"], h + 1),
        },
        {
          relation: ParentRelationType.MOTHER,
          key: `${studentSeedKey}-MOTHER`,
          primary: false,
          occupation: pick(["Fonctionnaire", "Commerçante", "Ménagère", "Infirmière", "Avocate"], h + 2),
        },
      ];

      const studentParentIds: number[] = [];

      for (const def of parentDefs) {
        const ph = hash(def.key);
        const parentFirstName = pick(FIRST_NAMES, ph);
        const parentLastName = lastName;

        let parent = await prisma.parent.findFirst({
          where: {
            establishmentId: establishment.id,
            firstName: parentFirstName,
            lastName: parentLastName,
          },
        });

        if (!parent) {
          parent = await prisma.parent.create({
            data: {
              establishmentId: establishment.id,
              firstName: parentFirstName,
              lastName: parentLastName,
              phone: `+237 6${["5", "6", "9"][ph % 3]}${String(ph).padStart(9, "0").slice(-6)}`,
              email: def.relation === ParentRelationType.FATHER ? `pere.${studentNumber.toLowerCase()}@demo.cm` : `mere.${studentNumber.toLowerCase()}@demo.cm`,
              occupation: def.occupation,
              ...(parentUserIds.length > 0 ? { userId: parentUserIds.shift() ?? null } : {}),
            },
          });
          seededParents.push(parent);
        }

        studentParentIds.push(parent.id);
      }

      for (const [index, parentId] of studentParentIds.entries()) {
        const relation = index === 0 ? ParentRelationType.FATHER : ParentRelationType.MOTHER;
        await prisma.studentParent.upsert({
          where: { studentId_parentId: { studentId: student.id, parentId } },
          update: {
            relationType: relation,
            isPrimaryContact: index === 0,
          },
          create: {
            studentId: student.id,
            parentId,
            relationType: relation,
            isPrimaryContact: index === 0,
          },
        });
      }

      // Tuteur légal pour ~la moitié des élèves.
      if (i % 2 === 0) {
        const guardianKey = `${studentSeedKey}-GUARDIAN`;
        const gh = hash(guardianKey);
        const guardianFirstName = pick(FIRST_NAMES, gh);
        const guardianLastName = pick(LAST_NAMES, Math.floor(gh / FIRST_NAMES.length));

        let guardian = await prisma.guardian.findFirst({
          where: {
            establishmentId: establishment.id,
            firstName: guardianFirstName,
            lastName: guardianLastName,
          },
        });

        if (!guardian) {
          guardian = await prisma.guardian.create({
            data: {
              establishmentId: establishment.id,
              firstName: guardianFirstName,
              lastName: guardianLastName,
              phone: `+237 6${["5", "7", "9"][gh % 3]}${String(gh).padStart(9, "0").slice(-6)}`,
              address: `Avenue ${pick(["Kennedy", "de la République", "des Palmiers"], gh)}`,
            },
          });
        }

        await prisma.studentGuardian.upsert({
          where: { studentId_guardianId: { studentId: student.id, guardianId: guardian.id } },
          update: { relationType: GuardianRelationType.LEGAL_GUARDIAN, isFinanciallyResponsible: true, canPickup: true },
          create: { studentId: student.id, guardianId: guardian.id, relationType: GuardianRelationType.LEGAL_GUARDIAN, isFinanciallyResponsible: true, canPickup: true },
        });
      }

      // Inscriptions : l'élève entre à partir d'une certaine année et suit le cursus.
      const startYearIndex = h % (establishment.type === SchoolType.PRIMARY ? 4 : 5);
      for (let yearIndex = startYearIndex; yearIndex < academicYears.length; yearIndex += 1) {
        const classIndex = (i + yearIndex) % classCount;
        const schoolClass = classes[classIndex];

        let status: EnrollmentStatus = EnrollmentStatus.ACTIVE;
        if (yearIndex === startYearIndex && i % 7 === 0) {
          status = EnrollmentStatus.REPEATING;
        }
        if (yearIndex === 0 && i % 9 === 0 && startYearIndex === 0) {
          status = EnrollmentStatus.GRADUATED;
        }

        const academicYear = academicYears[yearIndex];
        if (!academicYear || !schoolClass) {
          continue;
        }

        await prisma.enrollment.upsert({
          where: {
            studentId_academicYearId: {
              studentId: student.id,
              academicYearId: academicYear.id,
            },
          },
          update: {
            classId: schoolClass.id,
            enrollmentDate: academicYear.startDate,
            status,
          },
          create: {
            studentId: student.id,
            classId: schoolClass.id,
            academicYearId: academicYear.id,
            enrollmentDate: academicYear.startDate,
            status,
          },
        });
      }
    }

    const seededGuardians: Guardian[] = await prisma.guardian.findMany({
      where: { establishmentId: establishment.id },
    });

    void seededGuardians;
    void seededParents;
    void seededStudents;
    void classes;
    void classCount;
  }
}

async function findRoleUserIds(establishmentId: number, roleName: string): Promise<number[]> {
  const users = await prisma.user.findMany({
    where: {
      establishmentId,
      isActive: true,
      userRoles: { some: { role: { name: roleName } } },
      teacher: null,
      parent: null,
      student: null,
      guardian: null,
    },
    select: { id: true },
  });

  return users.map((u) => u.id);
}