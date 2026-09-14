import type { Establishment } from "../../src/generated/prisma/client.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

interface YearDef {
  startYear: number;
  endYear: number;
  periods: {
    name: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  }[];
}

// Années scolaires 2020/2021 → 2026/2027 (découpage en 3 trimestres à la camerounaise).
const years: YearDef[] = [2020, 2021, 2022, 2023, 2024, 2025, 2026].map((startYear) => ({
  startYear,
  endYear: startYear + 1,
  periods: [
    { name: "Trimestre 1", startMonth: 8, startDay: 1, endMonth: 11, endDay: 18 },
    { name: "Trimestre 2", startMonth: 0, startDay: 3, endMonth: 2, endDay: 31 },
    { name: "Trimestre 3", startMonth: 3, startDay: 1, endMonth: 5, endDay: 30 },
  ],
}));

export async function seedAcademicYears(establishments: Establishment[]) {
  const yearName = (def: YearDef) => `${def.startYear}-${def.endYear}`;

  for (const establishment of establishments) {
    // Une seule année courante par établissement (la plus récente).
    await prisma.academicYear.updateMany({
      where: { establishmentId: establishment.id },
      data: { isCurrent: false },
    });

    for (const def of years) {
      const name = yearName(def);
      const isCurrent = def.startYear === 2026;

      const academicYear = await prisma.academicYear.upsert({
        where: {
          establishmentId_name: {
            establishmentId: establishment.id,
            name,
          },
        },
        update: {
          startDate: startOf(def),
          endDate: endOf(def),
          isCurrent,
        },
        create: {
          establishmentId: establishment.id,
          name,
          startDate: startOf(def),
          endDate: endOf(def),
          isCurrent,
        },
      });

      for (const [index, period] of def.periods.entries()) {
        const seededPeriod = await prisma.period.upsert({
          where: {
            academicYearId_order: {
              academicYearId: academicYear.id,
              order: index + 1,
            },
          },
          update: {
            name: period.name,
            startDate: periodRange(def, period)[0],
            endDate: periodRange(def, period)[1],
          },
          create: {
            academicYearId: academicYear.id,
            name: period.name,
            order: index + 1,
            startDate: periodRange(def, period)[0],
            endDate: periodRange(def, period)[1],
          },
        });

        await seedSequences(seededPeriod);
      }
    }
  }
}

/**
 * Deux séquences par trimestre, à la camerounaise : le trimestre est coupé en son
 * milieu. Les évaluations déjà enregistrées sont rattachées à la séquence qui
 * couvre leur date, pour qu'aucune ne reste orpheline.
 */
async function seedSequences(period: { id: number; order: number; startDate: Date; endDate: Date }) {
  const midpoint = new Date((period.startDate.getTime() + period.endDate.getTime()) / 2);

  const ranges: [Date, Date][] = [
    [period.startDate, midpoint],
    [midpoint, period.endDate],
  ];

  for (const [index, [startDate, endDate]] of ranges.entries()) {
    const order = index + 1;

    const sequence = await prisma.sequence.upsert({
      where: { periodId_order: { periodId: period.id, order } },
      update: { startDate, endDate },
      create: {
        periodId: period.id,
        name: `Séquence ${(period.order - 1) * ranges.length + order}`,
        order,
        startDate,
        endDate,
      },
    });

    // Le rattachement partitionne toute la ligne du temps autour du milieu du
    // trimestre : une évaluation datée hors des bornes tombe dans la séquence la
    // plus proche plutôt que de rester sans séquence.
    await prisma.evaluation.updateMany({
      where: {
        periodId: period.id,
        sequenceId: null,
        date: order === 1 ? { lt: midpoint } : { gte: midpoint },
      },
      data: { sequenceId: sequence.id },
    });
  }
}

function startOf(def: YearDef) {
  return new Date(def.startYear, 8, 1);
}

function endOf(def: YearDef) {
  return new Date(def.endYear, 5, 30);
}

/**
 * L'année scolaire est à cheval sur deux années civiles : un mois de septembre ou
 * après appartient à l'année d'ouverture, janvier à juin à l'année de clôture.
 * Sans cette bascule, le premier trimestre s'étalait de septembre à décembre de
 * l'année suivante.
 */
function civilYear(def: YearDef, month: number): number {
  return month >= 8 ? def.startYear : def.endYear;
}

function periodRange(def: YearDef, period: YearDef["periods"][number]): [Date, Date] {
  return [
    new Date(civilYear(def, period.startMonth), period.startMonth, period.startDay),
    new Date(civilYear(def, period.endMonth), period.endMonth, period.endDay),
  ];
}