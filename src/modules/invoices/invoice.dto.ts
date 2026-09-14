import { z } from "zod";

import { InvoiceStatus } from "../../generated/prisma/enums.js";

const invoiceLineSchema = z.object({
  feeTypeId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive(),
  dueDate: z.coerce.date(),
  lines: z.array(invoiceLineSchema).min(1),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.coerce.date().optional(),
  status: z.enum(InvoiceStatus).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
