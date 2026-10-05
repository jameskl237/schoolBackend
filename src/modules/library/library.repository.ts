import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const bookInclude = {
  copies: { orderBy: { inventoryCode: "asc" } },
  _count: { select: { copies: true } },
} satisfies Prisma.BookInclude;

const loanInclude = {
  bookCopy: {
    select: {
      id: true,
      inventoryCode: true,
      status: true,
      book: { select: { id: true, title: true, author: true } },
    },
  },
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
} satisfies Prisma.LoanInclude;

export interface LoanFilters {
  status?: string;
  studentId?: number;
  teacherId?: number;
}

export class LibraryRepository {
  findBooks(establishmentId: number, search?: string) {
    return prisma.book.findMany({
      where: {
        establishmentId,
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { author: { contains: search } },
                { isbn: { contains: search } },
              ],
            }
          : {}),
      },
      include: bookInclude,
      orderBy: { title: "asc" },
    });
  }

  findBook(id: number, establishmentId: number) {
    return prisma.book.findFirst({ where: { id, establishmentId }, include: bookInclude });
  }

  createBook(data: Prisma.BookUncheckedCreateInput) {
    return prisma.book.create({ data, include: bookInclude });
  }

  updateBook(id: number, data: Prisma.BookUpdateInput) {
    return prisma.book.update({ where: { id }, data, include: bookInclude });
  }

  deleteBook(id: number) {
    return prisma.book.delete({ where: { id } });
  }

  findCopy(id: number, establishmentId: number) {
    return prisma.bookCopy.findFirst({
      where: { id, book: { establishmentId } },
      include: { book: { select: { id: true, title: true } } },
    });
  }

  createCopies(data: Prisma.BookCopyUncheckedCreateInput[]) {
    return prisma.bookCopy.createMany({ data });
  }

  updateCopy(id: number, data: Prisma.BookCopyUpdateInput) {
    return prisma.bookCopy.update({ where: { id }, data });
  }

  deleteCopy(id: number) {
    return prisma.bookCopy.delete({ where: { id } });
  }

  countCopies(bookId: number) {
    return prisma.bookCopy.count({ where: { bookId } });
  }

  findLoans(establishmentId: number, filters: LoanFilters = {}) {
    return prisma.loan.findMany({
      where: {
        bookCopy: { book: { establishmentId } },
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      },
      include: loanInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 300,
    });
  }

  findLoan(id: number, establishmentId: number) {
    return prisma.loan.findFirst({
      where: { id, bookCopy: { book: { establishmentId } } },
      include: loanInclude,
    });
  }

  /** Prêt et exemplaire changent d'état ensemble : jamais l'un sans l'autre. */
  createLoan(data: Prisma.LoanUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({ data, include: loanInclude });

      await tx.bookCopy.update({ where: { id: data.bookCopyId }, data: { status: "BORROWED" } });

      return loan;
    });
  }

  returnLoan(id: number, bookCopyId: number) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.update({
        where: { id },
        data: { status: "RETURNED", returnDate: new Date() },
        include: loanInclude,
      });

      await tx.bookCopy.update({ where: { id: bookCopyId }, data: { status: "AVAILABLE" } });

      return loan;
    });
  }

  updateLoan(id: number, data: Prisma.LoanUpdateInput) {
    return prisma.loan.update({ where: { id }, data, include: loanInclude });
  }

  deleteLoan(id: number) {
    return prisma.loan.delete({ where: { id } });
  }
}
