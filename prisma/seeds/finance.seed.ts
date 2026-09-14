import type { Establishment } from "../../src/generated/prisma/client.js";
import {
  InvoiceStatus,
  PaymentMethod,
  SchoolType,
} from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

export async function seedFinance(establishments: Establishment[]) {
  for (const establishment of establishments) {
    const currentYear = await prisma.academicYear.findFirst({
      where: { establishmentId: establishment.id, isCurrent: true },
    });
    if (!currentYear) {
      continue;
    }

    const baseFee =
      establishment.type === SchoolType.PRIMARY
        ? 50_000
        : establishment.type === SchoolType.SECONDARY
          ? 150_000
          : 100_000;

    const feeTypes = [
      { name: "Frais de scolarité", description: "Frais annuels de scolarité" },
      { name: "Frais d'inscription", description: "Frais payés à l'inscription" },
      { name: "APE", description: "Association des parents d'élèves" },
      { name: "Transport scolaire", description: "Service de transport" },
      { name: "Cantine", description: "Repas à la cantine" },
    ];

    const seededFeeTypes = new Map<string, number>();
    for (const feeType of feeTypes) {
      const seeded = await prisma.feeType.upsert({
        where: { establishmentId_name: { establishmentId: establishment.id, name: feeType.name } },
        update: { description: feeType.description },
        create: { establishmentId: establishment.id, name: feeType.name, description: feeType.description },
      });
      seededFeeTypes.set(feeType.name, seeded.id);
    }

    const classes = await prisma.class.findMany({
      where: { gradeLevel: { cycle: { section: { schoolLevel: { establishmentId: establishment.id } } } } },
      orderBy: { code: "asc" },
    });

    const getScolariteAmount = (classIndex: number) => baseFee + (classIndex + 1) * 5_000;

    // Grille tarifaire pour l'année courante.
    for (const [classIndex, schoolClass] of classes.entries()) {
      const existing = await prisma.feeStructure.findFirst({
        where: { feeTypeId: seededFeeTypes.get("Frais de scolarité")!, classId: schoolClass.id, academicYearId: currentYear.id },
      });

      if (!existing) {
        await prisma.feeStructure.create({
          data: {
            feeTypeId: seededFeeTypes.get("Frais de scolarité")!,
            classId: schoolClass.id,
            academicYearId: currentYear.id,
            amount: getScolariteAmount(classIndex),
            dueDate: new Date(currentYear.endDate.getTime() - 60 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    for (const [feeName, feeTypeId] of [
      ["Frais d'inscription", seededFeeTypes.get("Frais d'inscription")!],
      ["APE", seededFeeTypes.get("APE")!],
      ["Transport scolaire", seededFeeTypes.get("Transport scolaire")!],
      ["Cantine", seededFeeTypes.get("Cantine")!],
    ] as const) {
      const amount =
        feeName === "Frais d'inscription"
          ? 10_000
          : feeName === "APE"
            ? 5_000
            : feeName === "Transport scolaire"
              ? 25_000
              : 20_000;

      const existing = await prisma.feeStructure.findFirst({
        where: { feeTypeId, classId: null, academicYearId: currentYear.id },
      });

      if (!existing) {
        await prisma.feeStructure.create({
          data: {
            feeTypeId,
            classId: null,
            academicYearId: currentYear.id,
            amount,
            dueDate: new Date(currentYear.endDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    const enrols = await prisma.enrollment.findMany({
      where: { academicYearId: currentYear.id },
      include: {
        class: true,
        student: true,
      },
      orderBy: { id: "asc" },
    });

    const accountant = await prisma.user.findFirst({
      where: { establishmentId: establishment.id, isActive: true, userRoles: { some: { role: { name: "COMPTABLE" } } } },
      orderBy: { id: "asc" },
      select: { id: true },
    });

    for (const [index, enrollment] of enrols.entries()) {
      if (!enrollment.student) {
        continue;
      }

      const classIndex = classes.findIndex((c) => c.id === enrollment.classId);
      const scolarite = getScolariteAmount(Math.max(classIndex, 0));
      const inscription = 10_000;
      const total = scolarite + inscription;

      const status: InvoiceStatus =
        index % 4 === 0
          ? InvoiceStatus.PENDING
          : index % 4 === 1
            ? InvoiceStatus.PARTIALLY_PAID
            : index % 4 === 2
              ? InvoiceStatus.PAID
              : InvoiceStatus.OVERDUE;

      const issueDate = new Date(currentYear.startDate.getFullYear(), 8, 10);

      let invoice = await prisma.invoice.findFirst({
        where: { studentId: enrollment.studentId, academicYearId: currentYear.id },
      });

      if (!invoice) {
        invoice = await prisma.invoice.create({
          data: {
            studentId: enrollment.studentId,
            academicYearId: currentYear.id,
            issueDate,
            dueDate: new Date(currentYear.startDate.getFullYear(), 11, 31),
            totalAmount: total,
            status,
          },
        });
      }

      for (const [feeName, amount] of [
        ["Frais de scolarité", scolarite],
        ["Frais d'inscription", inscription],
      ] as const) {
        const feeTypeId = seededFeeTypes.get(feeName)!;
        const description = feeName === "Frais de scolarité" ? "Trimestres et frais divers" : "Inscription";
        const existingLine = await prisma.invoiceLine.findFirst({
          where: { invoiceId: invoice.id, feeTypeId, description },
        });

        if (!existingLine) {
          await prisma.invoiceLine.create({
            data: { invoiceId: invoice.id, feeTypeId, amount, description },
          });
        }
      }

      if (accountant) {
        await seedInvoicePayments(invoice.id, total, status, accountant.id, index);
      }
    }
  }
}

async function seedInvoicePayments(
  invoiceId: number,
  total: number,
  status: InvoiceStatus,
  receivedById: number,
  index: number,
) {
  const existingPayments = await prisma.payment.findMany({ where: { invoiceId } });
  if (existingPayments.length > 0) {
    return;
  }

  const paymentAmount =
    status === InvoiceStatus.PAID
      ? total
      : status === InvoiceStatus.PARTIALLY_PAID
        ? Math.round(total * 0.6)
        : status === InvoiceStatus.OVERDUE
          ? Math.round(total * 0.3)
          : null;

  if (paymentAmount === null) {
    return;
  }

  const method: PaymentMethod = index % 3 === 0 ? PaymentMethod.MOBILE_MONEY : index % 3 === 1 ? PaymentMethod.CASH : PaymentMethod.BANK_TRANSFER;

  await prisma.payment.create({
    data: {
      invoiceId,
      amount: paymentAmount,
      paymentDate: new Date(),
      method,
      ...(method === PaymentMethod.MOBILE_MONEY
        ? { reference: `MTN-${String(48000 + index * 137).padStart(6, "0")}` }
        : {}),
      receivedById,
    },
  });
}