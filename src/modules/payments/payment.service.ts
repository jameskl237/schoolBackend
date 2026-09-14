import { AppError } from "../../common/errors/app-error.js";
import { InvoiceRepository } from "../invoices/invoice.repository.js";

import type { CreatePaymentInput } from "./payment.dto.js";
import { PaymentRepository } from "./payment.repository.js";

export class PaymentService {
  constructor(
    private readonly paymentRepository = new PaymentRepository(),
    private readonly invoiceRepository = new InvoiceRepository(),
  ) {}

  list(establishmentId: number, invoiceId?: number) {
    return this.paymentRepository.findMany(establishmentId, invoiceId);
  }

  async create(establishmentId: number, receivedById: number, input: CreatePaymentInput) {
    const invoice = await this.invoiceRepository.findById(input.invoiceId, establishmentId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }

    if (invoice.status === "CANCELLED") {
      throw new AppError("Cannot record a payment on a cancelled invoice", 409, "INVOICE_CANCELLED");
    }

    const payment = await this.paymentRepository.create({
      amount: input.amount,
      method: input.method,
      ...(input.reference !== undefined ? { reference: input.reference } : {}),
      invoice: { connect: { id: input.invoiceId } },
      receivedBy: { connect: { id: receivedById } },
    });

    await this.recomputeInvoiceStatus(input.invoiceId, establishmentId);

    return payment;
  }

  async remove(id: number, establishmentId: number) {
    const payment = await this.paymentRepository.findById(id, establishmentId);

    if (!payment) {
      throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    }

    await this.paymentRepository.delete(id);
    await this.recomputeInvoiceStatus(payment.invoice.id, establishmentId);
  }

  private async recomputeInvoiceStatus(invoiceId: number, establishmentId: number) {
    const invoice = await this.invoiceRepository.findById(invoiceId, establishmentId);

    if (!invoice || invoice.status === "CANCELLED") return;

    const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const total = Number(invoice.totalAmount);
    const status = paid <= 0 ? "PENDING" : paid >= total ? "PAID" : "PARTIALLY_PAID";

    if (status !== invoice.status) {
      await this.invoiceRepository.update(invoiceId, { status });
    }
  }
}
