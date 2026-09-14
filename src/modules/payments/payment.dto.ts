import { z } from "zod";

import { PaymentMethod } from "../../generated/prisma/enums.js";

export const createPaymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  method: z.enum(PaymentMethod),
  reference: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
