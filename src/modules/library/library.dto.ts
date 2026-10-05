import { z } from "zod";

import { BookCopyStatus, LoanStatus } from "../../generated/prisma/enums.js";

export const createBookSchema = z.object({
  title: z.string().min(1),
  isbn: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  publishedYear: z.coerce.number().int().min(1400).max(2200).nullable().optional(),
  /** Nombre d'exemplaires à créer d'emblée, avec des codes d'inventaire dérivés. */
  copies: z.coerce.number().int().min(0).max(100).optional(),
});

export const updateBookSchema = createBookSchema.omit({ copies: true }).partial();

export const createCopySchema = z.object({
  bookId: z.coerce.number().int().positive(),
  inventoryCode: z.string().min(1),
  status: z.enum(BookCopyStatus).optional(),
});

export const updateCopySchema = z.object({
  inventoryCode: z.string().min(1).optional(),
  status: z.enum(BookCopyStatus).optional(),
});

/** Un emprunt vise un élève ou un enseignant, jamais les deux ni aucun. */
export const createLoanSchema = z
  .object({
    bookCopyId: z.coerce.number().int().positive(),
    studentId: z.coerce.number().int().positive().optional(),
    teacherId: z.coerce.number().int().positive().optional(),
    dueDate: z.coerce.date(),
  })
  .refine((input) => Boolean(input.studentId) !== Boolean(input.teacherId), {
    message: "Un emprunt doit viser soit un élève, soit un enseignant",
    path: ["studentId"],
  });

export const updateLoanSchema = z.object({
  dueDate: z.coerce.date().optional(),
  status: z.enum(LoanStatus).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateCopyInput = z.infer<typeof createCopySchema>;
export type UpdateCopyInput = z.infer<typeof updateCopySchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
