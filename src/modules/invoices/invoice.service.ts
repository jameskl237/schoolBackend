import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";
import { FeeTypeRepository } from "../fee-types/fee-type.repository.js";
import { StudentRepository } from "../students/student.repository.js";

import type { CreateInvoiceInput, UpdateInvoiceInput } from "./invoice.dto.js";
import { InvoiceRepository } from "./invoice.repository.js";

export class InvoiceService {
  constructor(
    private readonly invoiceRepository = new InvoiceRepository(),
    private readonly studentRepository = new StudentRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
    private readonly feeTypeRepository = new FeeTypeRepository(),
  ) {}

  list(establishmentId: number, filters: { studentId?: number; academicYearId?: number }) {
    return this.invoiceRepository.findMany(establishmentId, filters);
  }

  async get(id: number, establishmentId: number) {
    const invoice = await this.invoiceRepository.findById(id, establishmentId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }

    return invoice;
  }

  async create(establishmentId: number, input: CreateInvoiceInput) {
    const student = await this.studentRepository.findById(input.studentId, establishmentId);
    if (!student) throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");

    const academicYear = await this.academicYearRepository.findById(input.academicYearId, establishmentId);
    if (!academicYear) throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");

    for (const line of input.lines) {
      const feeType = await this.feeTypeRepository.findById(line.feeTypeId, establishmentId);
      if (!feeType) throw new AppError("Fee type not found", 404, "FEE_TYPE_NOT_FOUND");
    }

    const totalAmount = input.lines.reduce((sum, line) => sum + line.amount, 0);

    return this.invoiceRepository.create({
      dueDate: input.dueDate,
      totalAmount,
      student: { connect: { id: input.studentId } },
      academicYear: { connect: { id: input.academicYearId } },
      lines: {
        create: input.lines.map((line) => ({
          amount: line.amount,
          ...(line.description !== undefined ? { description: line.description } : {}),
          feeType: { connect: { id: line.feeTypeId } },
        })),
      },
    });
  }

  async update(id: number, establishmentId: number, input: UpdateInvoiceInput) {
    await this.get(id, establishmentId);

    return this.invoiceRepository.update(id, stripUndefined(input));
  }

  async remove(id: number, establishmentId: number) {
    const invoice = await this.get(id, establishmentId);

    if (invoice.payments.length > 0) {
      throw new AppError(
        "Cannot delete an invoice with recorded payments — cancel it instead",
        409,
        "INVOICE_HAS_PAYMENTS",
      );
    }

    return this.invoiceRepository.delete(id);
  }
}
