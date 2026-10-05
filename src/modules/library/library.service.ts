import { AppError } from "../../common/errors/app-error.js";
import type { AccessScope } from "../../common/utils/access-scope.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { Prisma } from "../../generated/prisma/client.js";
import { StudentRepository } from "../students/student.repository.js";
import { TeacherRepository } from "../teachers/teacher.repository.js";

import type {
  CreateBookInput,
  CreateCopyInput,
  CreateLoanInput,
  UpdateBookInput,
  UpdateCopyInput,
  UpdateLoanInput,
} from "./library.dto.js";
import { LibraryRepository, type LoanFilters } from "./library.repository.js";

export class LibraryService {
  constructor(
    private readonly libraryRepository = new LibraryRepository(),
    private readonly studentRepository = new StudentRepository(),
    private readonly teacherRepository = new TeacherRepository(),
  ) {}

  listBooks(scope: AccessScope, search?: string) {
    return this.libraryRepository.findBooks(scope.establishmentId, search);
  }

  async getBook(id: number, scope: AccessScope) {
    const book = await this.libraryRepository.findBook(id, scope.establishmentId);

    if (!book) {
      throw new AppError("Book not found", 404, "BOOK_NOT_FOUND");
    }

    return book;
  }

  async createBook(scope: AccessScope, input: CreateBookInput) {
    const { copies = 0, ...fields } = input;

    try {
      const book = await this.libraryRepository.createBook({
        establishmentId: scope.establishmentId,
        title: fields.title,
        isbn: fields.isbn ?? null,
        author: fields.author ?? null,
        publisher: fields.publisher ?? null,
        category: fields.category ?? null,
        publishedYear: fields.publishedYear ?? null,
      });

      if (copies > 0) {
        await this.libraryRepository.createCopies(this.buildCopies(book.id, copies, 0));
      }

      return this.getBook(book.id, scope);
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async updateBook(id: number, scope: AccessScope, input: UpdateBookInput) {
    await this.getBook(id, scope);

    try {
      return await this.libraryRepository.updateBook(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async removeBook(id: number, scope: AccessScope) {
    const book = await this.getBook(id, scope);

    const borrowed = book.copies.filter((copy) => copy.status === "BORROWED");

    if (borrowed.length > 0) {
      throw new AppError(
        "Des exemplaires de ce livre sont encore empruntés",
        409,
        "BOOK_HAS_ACTIVE_LOANS",
      );
    }

    return this.libraryRepository.deleteBook(id);
  }

  /** Ajoute des exemplaires supplémentaires à un titre déjà au catalogue. */
  async addCopies(scope: AccessScope, bookId: number, count: number) {
    await this.getBook(bookId, scope);

    const existing = await this.libraryRepository.countCopies(bookId);

    await this.libraryRepository.createCopies(this.buildCopies(bookId, count, existing));

    return this.getBook(bookId, scope);
  }

  async createCopy(scope: AccessScope, input: CreateCopyInput) {
    await this.getBook(input.bookId, scope);

    try {
      await this.libraryRepository.createCopies([
        {
          bookId: input.bookId,
          inventoryCode: input.inventoryCode,
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      ]);

      return this.getBook(input.bookId, scope);
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async updateCopy(id: number, scope: AccessScope, input: UpdateCopyInput) {
    await this.ensureCopyExists(id, scope);

    try {
      return await this.libraryRepository.updateCopy(id, stripUndefined(input));
    } catch (error) {
      throw this.mapKnownErrors(error);
    }
  }

  async removeCopy(id: number, scope: AccessScope) {
    const copy = await this.ensureCopyExists(id, scope);

    if (copy.status === "BORROWED") {
      throw new AppError("Cet exemplaire est actuellement emprunté", 409, "COPY_BORROWED");
    }

    return this.libraryRepository.deleteCopy(id);
  }

  listLoans(scope: AccessScope, filters: LoanFilters) {
    return this.libraryRepository.findLoans(scope.establishmentId, filters);
  }

  async createLoan(scope: AccessScope, input: CreateLoanInput) {
    const copy = await this.ensureCopyExists(input.bookCopyId, scope);

    if (copy.status !== "AVAILABLE") {
      throw new AppError("Cet exemplaire n'est pas disponible", 409, "COPY_NOT_AVAILABLE");
    }

    if (input.studentId !== undefined) {
      if (!(await this.studentRepository.findById(input.studentId, scope.establishmentId))) {
        throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
      }
    }

    if (input.teacherId !== undefined) {
      if (!(await this.teacherRepository.findById(input.teacherId, scope.establishmentId))) {
        throw new AppError("Teacher not found", 404, "TEACHER_NOT_FOUND");
      }
    }

    return this.libraryRepository.createLoan({
      bookCopyId: input.bookCopyId,
      studentId: input.studentId ?? null,
      teacherId: input.teacherId ?? null,
      dueDate: input.dueDate,
    });
  }

  /** Le retour libère l'exemplaire et clôt l'emprunt. */
  async returnLoan(id: number, scope: AccessScope) {
    const loan = await this.ensureLoanExists(id, scope);

    if (loan.status === "RETURNED") {
      return loan;
    }

    return this.libraryRepository.returnLoan(id, loan.bookCopy.id);
  }

  async updateLoan(id: number, scope: AccessScope, input: UpdateLoanInput) {
    await this.ensureLoanExists(id, scope);

    return this.libraryRepository.updateLoan(id, stripUndefined(input));
  }

  async removeLoan(id: number, scope: AccessScope) {
    await this.ensureLoanExists(id, scope);

    return this.libraryRepository.deleteLoan(id);
  }

  /** Codes d'inventaire dérivés du titre : LIV-<id>-001, -002, ... */
  private buildCopies(bookId: number, count: number, offset: number) {
    return Array.from({ length: count }, (_, index) => ({
      bookId,
      inventoryCode: `LIV-${bookId}-${String(offset + index + 1).padStart(3, "0")}`,
    }));
  }

  private async ensureCopyExists(id: number, scope: AccessScope) {
    const copy = await this.libraryRepository.findCopy(id, scope.establishmentId);

    if (!copy) {
      throw new AppError("Book copy not found", 404, "BOOK_COPY_NOT_FOUND");
    }

    return copy;
  }

  private async ensureLoanExists(id: number, scope: AccessScope) {
    const loan = await this.libraryRepository.findLoan(id, scope.establishmentId);

    if (!loan) {
      throw new AppError("Loan not found", 404, "LOAN_NOT_FOUND");
    }

    return loan;
  }

  private mapKnownErrors(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new AppError("Ce code d'inventaire est déjà utilisé", 409, "INVENTORY_CODE_TAKEN");
    }

    return error;
  }
}
