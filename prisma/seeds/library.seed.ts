import type { Establishment } from "../../src/generated/prisma/client.js";
import { BookCopyStatus, LoanStatus } from "../../src/generated/prisma/enums.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

const BOOKS = [
  { title: "Une vie de boy", author: "Ferdinand Oyono", publisher: "Presence Africaine", category: "Roman", publishedYear: 1956 },
  { title: "Le pauvre Christ de Bomba", author: "Mongo Beti", publisher: "Presence Africaine", category: "Roman", publishedYear: 1956 },
  { title: "L'Enfant noir", author: "Camara Laye", publisher: "Plon", category: "Roman", publishedYear: 1953 },
  { title: "Ville cruelle", author: "Mongo Beti", publisher: "Presence Africaine", category: "Roman", publishedYear: 1954 },
  { title: "Mission terminée", author: "Mongo Beti", publisher: "Buchet/Chastel", category: "Roman", publishedYear: 1957 },
  { title: "Mathématiques 6e", author: "Collectif", publisher: "EDICEF", category: "Manuel scolaire", publishedYear: 2019 },
  { title: "Le Français au collège", author: "Collectif", publisher: "Hachette", category: "Manuel scolaire", publishedYear: 2020 },
  { title: "Histoire du Cameroun", author: "Engelbert Mveng", publisher: "CLE", category: "Histoire", publishedYear: 1984 },
];

export async function seedLibrary(establishments: Establishment[]) {
  for (const establishment of establishments) {
    const books = [];
    for (const [index, book] of BOOKS.entries()) {
      let seededBook = await prisma.book.findFirst({
        where: { establishmentId: establishment.id, title: book.title },
      });

      if (!seededBook) {
        seededBook = await prisma.book.create({
          data: {
            establishmentId: establishment.id,
            isbn: `978-9956-${String(1000 + index).padStart(4, "0")}-${index % 10}`,
            title: book.title,
            author: book.author,
            publisher: book.publisher,
            category: book.category,
            publishedYear: book.publishedYear,
          },
        });
      }

      books.push(seededBook);
    }

    for (const [bookIndex, book] of books.entries()) {
      const copyCount = 2 + (bookIndex % 2);
      for (let copyIndex = 1; copyIndex <= copyCount; copyIndex += 1) {
        const inventoryCode = `INV-${establishment.code.replaceAll("-", "")}-${String(bookIndex + 1).padStart(2, "0")}-${String(copyIndex).padStart(2, "0")}`;

        await prisma.bookCopy.upsert({
          where: { inventoryCode },
          update: {},
          create: { bookId: book.id, inventoryCode, status: BookCopyStatus.AVAILABLE },
        });
      }
    }

    const currentYear = await prisma.academicYear.findFirst({
      where: { establishmentId: establishment.id, isCurrent: true },
    });

    const copies = await prisma.bookCopy.findMany({
      where: { book: { establishmentId: establishment.id } },
      orderBy: { inventoryCode: "asc" },
    });
    const students = await prisma.student.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { id: "asc" },
    });
    const teachers = await prisma.teacher.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { id: "asc" },
    });

    const referenceDate = currentYear?.startDate ?? new Date();

    for (const [index, copy] of copies.entries()) {
      if (index % 2 === 1) {
        continue;
      }

      const student = students[index % students.length];
      const teacher = teachers[(index + 1) % teachers.length];
      const useStudent = index % 4 !== 3 || !teacher;
      const loanDate = new Date(referenceDate.getTime() + (10 + index) * 24 * 60 * 60 * 1000);
      const dueDate = new Date(loanDate.getTime() + 14 * 24 * 60 * 60 * 1000);

      const existing = await prisma.loan.findFirst({ where: { bookCopyId: copy.id, loanDate } });
      if (existing) {
        continue;
      }

      const variant = index % 6;
      const status =
        variant === 0
          ? LoanStatus.RETURNED
          : variant === 1
            ? LoanStatus.ONGOING
            : variant === 2
              ? LoanStatus.OVERDUE
              : LoanStatus.RETURNED;

      const returnDate =
        status === LoanStatus.RETURNED
          ? new Date(loanDate.getTime() + 10 * 24 * 60 * 60 * 1000)
          : null;

      await prisma.loan.create({
        data: {
          bookCopyId: copy.id,
          ...(useStudent && student ? { studentId: student.id } : teacher ? { teacherId: teacher.id } : {}),
          loanDate,
          dueDate,
          returnDate,
          status,
        },
      });

      await prisma.bookCopy.update({
        where: { id: copy.id },
        data: {
          status:
            status === LoanStatus.ONGOING || status === LoanStatus.OVERDUE
              ? BookCopyStatus.BORROWED
              : BookCopyStatus.AVAILABLE,
        },
      });
    }
  }
}