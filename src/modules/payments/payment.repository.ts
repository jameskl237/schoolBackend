import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const paymentInclude = {
  receivedBy: { select: { id: true, firstName: true, lastName: true } },
  invoice: { select: { id: true, totalAmount: true, status: true } },
} satisfies Prisma.PaymentInclude;

export class PaymentRepository {
  findMany(establishmentId: number, invoiceId?: number) {
    return prisma.payment.findMany({
      where: {
        invoice: { student: { establishmentId } },
        ...(invoiceId ? { invoiceId } : {}),
      },
      include: paymentInclude,
      orderBy: { paymentDate: "desc" },
    });
  }

  findById(id: number, establishmentId: number) {
    return prisma.payment.findFirst({
      where: { id, invoice: { student: { establishmentId } } },
      include: paymentInclude,
    });
  }

  create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({ data, include: paymentInclude });
  }

  delete(id: number) {
    return prisma.payment.delete({ where: { id } });
  }
}
