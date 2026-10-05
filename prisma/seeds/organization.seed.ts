import type {
  Establishment,
  GradeLevel,
  SchoolLevel,
  Section,
  Cycle,
  Class,
  Classroom,
} from "../../src/generated/prisma/client.js";
import {
  Gender,
  SchoolLevelType,
  SchoolType,
  SectionLanguage,
} from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

interface GradeLevelDef {
  code: string;
  name: string;
}
interface CycleDef {
  code: string;
  name: string;
  gradeLevels: GradeLevelDef[];
}
interface SectionDef {
  name: string;
  language: SectionLanguage;
  cycles: CycleDef[];
}
interface LevelDef {
  name: string;
  type: SchoolLevelType;
  sections: SectionDef[];
}
interface ClassDef {
  gradeLevelCode: string;
  code: string;
  name: string;
}
interface SubjectDef {
  code: string;
  name: string;
}

const PRIMARY_LEVELS: LevelDef[] = [
  {
    name: "Maternelle",
    type: SchoolLevelType.PRESCHOOL,
    sections: [
      {
        name: "Section Francophone",
        language: SectionLanguage.FRANCOPHONE,
        cycles: [
          {
            code: "MAT",
            name: "Cycle maternel",
            gradeLevels: [
              { code: "PS", name: "Petite Section" },
              { code: "MS", name: "Moyenne Section" },
              { code: "GS", name: "Grande Section" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Primaire",
    type: SchoolLevelType.PRIMARY,
    sections: [
      {
        name: "Section Francophone",
        language: SectionLanguage.FRANCOPHONE,
        cycles: [
          { code: "C1", name: "Cycle d'initiation", gradeLevels: [{ code: "CP", name: "Cours préparatoire" }] },
          {
            code: "C2",
            name: "Cycle élémentaire",
            gradeLevels: [
              { code: "CE1", name: "Cours élémentaire 1" },
              { code: "CE2", name: "Cours élémentaire 2" },
            ],
          },
          {
            code: "C3",
            name: "Cycle moyen",
            gradeLevels: [
              { code: "CM1", name: "Cours moyen 1" },
              { code: "CM2", name: "Cours moyen 2" },
            ],
          },
        ],
      },
      {
        name: "Section Anglophone",
        language: SectionLanguage.ANGLOPHONE,
        cycles: [
          { code: "A1", name: "Lower Primary", gradeLevels: [{ code: "C1", name: "Class 1" }, { code: "C2", name: "Class 2" }] },
          { code: "A2", name: "Middle Primary", gradeLevels: [{ code: "C3", name: "Class 3" }, { code: "C4", name: "Class 4" }] },
          { code: "A3", name: "Upper Primary", gradeLevels: [{ code: "C5", name: "Class 5" }, { code: "C6", name: "Class 6" }] },
        ],
      },
    ],
  },
];

const SECONDARY_LEVELS: LevelDef[] = [
  {
    name: "Collège",
    type: SchoolLevelType.MIDDLE_SCHOOL,
    sections: [
      {
        name: "Section Francophone",
        language: SectionLanguage.FRANCOPHONE,
        cycles: [
          {
            code: "COB",
            name: "Cycle d'observation",
            gradeLevels: [
              { code: "6E", name: "6ème" },
              { code: "5E", name: "5ème" },
            ],
          },
          {
            code: "COR",
            name: "Cycle d'orientation",
            gradeLevels: [
              { code: "4E", name: "4ème" },
              { code: "3E", name: "3ème" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Lycée",
    type: SchoolLevelType.HIGH_SCHOOL,
    sections: [
      {
        name: "Section Francophone",
        language: SectionLanguage.FRANCOPHONE,
        cycles: [
          { code: "L1", name: "Cycle 1", gradeLevels: [{ code: "2NDE", name: "2nde" }] },
          {
            code: "L2",
            name: "Cycle 2",
            gradeLevels: [
              { code: "1ERE", name: "1ère" },
              { code: "TLE", name: "Terminale" },
            ],
          },
        ],
      },
    ],
  },
];

const PRIMARY_CLASSES: ClassDef[] = [
  { gradeLevelCode: "CP", code: "CP1", name: "CP1" },
  { gradeLevelCode: "CP", code: "CP2", name: "CP2" },
  { gradeLevelCode: "CE1", code: "CE1", name: "CE1" },
  { gradeLevelCode: "CE2", code: "CE2", name: "CE2" },
  { gradeLevelCode: "CM1", code: "CM1", name: "CM1" },
  { gradeLevelCode: "CM2", code: "CM2", name: "CM2" },
];

const SECONDARY_CLASSES: ClassDef[] = [
  { gradeLevelCode: "6E", code: "6e1", name: "6e1" },
  { gradeLevelCode: "6E", code: "6e2", name: "6e2" },
  { gradeLevelCode: "5E", code: "5e1", name: "5e1" },
  { gradeLevelCode: "4E", code: "4e1", name: "4e1" },
  { gradeLevelCode: "3E", code: "3e1", name: "3e1" },
  { gradeLevelCode: "2NDE", code: "2nde1", name: "2nde1" },
  { gradeLevelCode: "1ERE", code: "1ère1", name: "1ère1" },
  { gradeLevelCode: "TLE", code: "Tle1", name: "Tle1" },
];

const PRIMARY_SUBJECTS: SubjectDef[] = [
  { code: "FRANCAIS", name: "Français" },
  { code: "MATHS", name: "Mathématiques" },
  { code: "ANGLAIS", name: "Anglais" },
  { code: "SCIENCES", name: "Sciences" },
  { code: "HIST-GEO", name: "Histoire et Géographie" },
  { code: "EDU-CIVIQUE", name: "Éducation Civique et Morale" },
];

const SECONDARY_SUBJECTS: SubjectDef[] = [
  { code: "MATHS", name: "Mathématiques" },
  { code: "FRANCAIS", name: "Français" },
  { code: "ANGLAIS", name: "Anglais" },
  { code: "PC", name: "Physique-Chimie" },
  { code: "SVT", name: "Sciences de la Vie et de la Terre" },
  { code: "HIST-GEO", name: "Histoire-Géographie" },
  { code: "PHILO", name: "Philosophie" },
  { code: "EPS", name: "Éducation Physique et Sportive" },
];

const FIRST_NAMES = ["Jean", "Marie", "Paul", "Christelle", "Emmanuel", "Sylvie", "Blaise", "Cécile", "André", "Aïcha"];
const LAST_NAMES = ["Mballa", "Ngono", "Fotso", "Kamga", "Nkolo", "Etoundi", "Fouda", "Tchoua", "Nguemo", "Talla"];

const hash = (input: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

export interface OrganizationSeedResult {
  establishmentId: number;
  levels: SchoolLevel[];
  sections: Section[];
  cycles: Cycle[];
  gradeLevels: GradeLevel[];
  classes: Class[];
  subjectCodes: string[];
  teacherCount: number;
  classDefs: ClassDef[];
  subjectDefs: SubjectDef[];
}

const orderedClassDefs = (organizationType: SchoolType): ClassDef[] => {
  if (organizationType === SchoolType.PRIMARY) return PRIMARY_CLASSES;
  if (organizationType === SchoolType.SECONDARY) return SECONDARY_CLASSES;
  return [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];
};

const orderedSubjectDefs = (organizationType: SchoolType): SubjectDef[] => {
  if (organizationType === SchoolType.PRIMARY) return PRIMARY_SUBJECTS;
  if (organizationType === SchoolType.SECONDARY) return SECONDARY_SUBJECTS;
  return [...PRIMARY_SUBJECTS, ...SECONDARY_SUBJECTS];
};

export async function seedOrganization(
  establishments: Establishment[],
): Promise<OrganizationSeedResult[]> {
  const results: OrganizationSeedResult[] = [];

  for (const establishment of establishments) {
    const organizationType = establishment.type === SchoolType.BOTH ? SchoolType.BOTH : establishment.type;

    const classDefs = orderedClassDefs(organizationType);
    const subjectDefs = orderedSubjectDefs(organizationType);

    const levels =
      organizationType === SchoolType.PRIMARY
        ? PRIMARY_LEVELS
        : organizationType === SchoolType.SECONDARY
          ? SECONDARY_LEVELS
          : [...PRIMARY_LEVELS, ...SECONDARY_LEVELS];

    const seededLevels: SchoolLevel[] = [];
    const seededSections: Section[] = [];
    const seededCycles: Cycle[] = [];
    const seededGradeLevels: GradeLevel[] = [];

    for (const level of levels) {
      const seededLevel = await prisma.schoolLevel.upsert({
        where: {
          establishmentId_name: { establishmentId: establishment.id, name: level.name },
        },
        update: { type: level.type },
        create: { establishmentId: establishment.id, name: level.name, type: level.type },
      });
      seededLevels.push(seededLevel);

      for (const section of level.sections) {
        const seededSection = await prisma.section.upsert({
          where: {
            schoolLevelId_language: { schoolLevelId: seededLevel.id, language: section.language },
          },
          update: { name: section.name },
          create: { schoolLevelId: seededLevel.id, name: section.name, language: section.language },
        });
        seededSections.push(seededSection);

        for (const cycle of section.cycles) {
          const seededCycle = await prisma.cycle.upsert({
            where: { sectionId_code: { sectionId: seededSection.id, code: cycle.code } },
            update: { name: cycle.name },
            create: { sectionId: seededSection.id, name: cycle.name, code: cycle.code },
          });
          seededCycles.push(seededCycle);

          for (const gradeLevel of cycle.gradeLevels) {
            const seededGradeLevel = await prisma.gradeLevel.upsert({
              where: { cycleId_code: { cycleId: seededCycle.id, code: gradeLevel.code } },
              update: { name: gradeLevel.name },
              create: { cycleId: seededCycle.id, name: gradeLevel.name, code: gradeLevel.code },
            });
            seededGradeLevels.push(seededGradeLevel);
          }
        }
      }
    }

    // Salles de classe : une salle par classe.
    const classrooms: Classroom[] = [];
    for (const [index, classDef] of classDefs.entries()) {
      const code = `S${index + 1}`;
      classrooms.push(
        await prisma.classroom.upsert({
          where: { establishmentId_code: { establishmentId: establishment.id, code } },
          update: { name: code, capacity: 40 },
          create: { establishmentId: establishment.id, name: code, code, capacity: 40 },
        }),
      );
    }
    const classroomByClassCode = Object.fromEntries(classDefs.map((c, i) => [c.code, classrooms[i]?.id]));

    const seededClasses: Class[] = [];
    for (const classDef of classDefs) {
      const gradeLevel = seededGradeLevels.find((g) => g.code === classDef.gradeLevelCode);
      if (!gradeLevel) {
        continue;
      }

      const seededClass = await prisma.class.upsert({
        where: { gradeLevelId_code: { gradeLevelId: gradeLevel.id, code: classDef.code } },
        update: {
          name: classDef.name,
          ...(classroomByClassCode[classDef.code] !== undefined ? { classroomId: classroomByClassCode[classDef.code] ?? null } : {}),
        },
        create: {
          gradeLevelId: gradeLevel.id,
          name: classDef.name,
          code: classDef.code,
          ...(classroomByClassCode[classDef.code] !== undefined ? { classroomId: classroomByClassCode[classDef.code] ?? null } : {}),
        },
      });
      seededClasses.push(seededClass);
    }

    for (const subject of subjectDefs) {
      await prisma.subject.upsert({
        where: { establishmentId_code: { establishmentId: establishment.id, code: subject.code } },
        update: { name: subject.name },
        create: { establishmentId: establishment.id, name: subject.name, code: subject.code },
      });
    }

    // Enseignants : 6 en primaire, 6 en secondaire, 10 en mixte.
    const teacherCount = organizationType === SchoolType.BOTH ? 10 : 6;
    const enseignantUsers = await prisma.user.findMany({
      where: {
        establishmentId: establishment.id,
        isActive: true,
        role: { name: "ENSEIGNANT" },
        teacher: null,
      },
      select: { id: true },
    });

    for (let i = 1; i <= teacherCount; i += 1) {
      const h = hash(`${establishment.code}-TEACHER-${i}`);
      const firstName = FIRST_NAMES[h % FIRST_NAMES.length] as string;
      const lastName = LAST_NAMES[Math.floor(h / FIRST_NAMES.length) % LAST_NAMES.length] as string;
      const employeeNumber = `ENS-${establishment.code.replaceAll("-", "")}-${String(i).padStart(2, "0")}`;
      const specialty = subjectDefs[(i - 1) % subjectDefs.length]?.name;
      const linkedUserId = enseignantUsers.length > 0 ? enseignantUsers.shift()!.id : undefined;

      await prisma.teacher.upsert({
        where: {
          establishmentId_employeeNumber: { establishmentId: establishment.id, employeeNumber },
        },
        update: { specialty },
        create: {
          establishmentId: establishment.id,
          employeeNumber,
          firstName,
          lastName,
          gender: h % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          phone: `+237 6${["5", "7", "8", "9"][h % 4]}${String(h).padStart(9, "0").slice(-6)}`,
          email: `enseignant-${i}@${establishment.code.toLowerCase()}.demo`,
          hireDate: new Date(2015 + (i % 8), 7, 15),
          specialty,
          ...(linkedUserId !== undefined ? { userId: linkedUserId } : {}),
        },
      });
    }

    results.push({
      establishmentId: establishment.id,
      levels: seededLevels,
      sections: seededSections,
      cycles: seededCycles,
      gradeLevels: seededGradeLevels,
      classes: seededClasses,
      subjectCodes: subjectDefs.map((s) => s.code),
      teacherCount,
      classDefs,
      subjectDefs,
    });
  }

  return results;
}