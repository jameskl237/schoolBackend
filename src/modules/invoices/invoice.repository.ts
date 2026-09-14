import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const invoiceInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  academicYear: { select: { id: true, name: true } },
  lines: { include: { feeType: { select: { id: true, name: true } } } },
  payments: {
    select: { id: true, amount: true, paymentDate: true, method: true, reference: true },
    orderBy: { paymentDate: "desc" as const },
  },
} satisfies Prisma.InvoiceInclude;

export interface InvoiceFilters {
  studentId?: number;
  academicYearId?: number;
}

export class InvoiceRepository {
  findMany(establishmentId: number, filters: InvoiceFilters = {}) {
    return prisma.invoice.findMany({
      where: {
        student: { establishmentId },
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: invoiceInclude,
      orderBy: { issueDate: "desc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.invoice.findFirst({
      where: { id, student: { establishmentId } },
      include: invoiceInclude,
    });
  }

  create(data: Prisma.InvoiceCreateInput) {
    return prisma.invoice.create({ data, include: invoiceInclude });
  }

  update(id: number, data: Prisma.InvoiceUpdateInput) {
    return prisma.invoice.update({ where: { id }, data, include: invoiceInclude });
  }

  delete(id: number) {
    return prisma.invoice.delete({ where: { id } });
  }
}
