import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { LibraryController } from "./library.controller.js";

const router = Router();
const controller = new LibraryController();
const canManageBooks = authorize("books.manage");
// Qui gère les emprunts consulte forcément le catalogue.
const canReadBooks = authorize("books.manage", "loans.manage");
const canManageLoans = authorize("loans.manage");

router.get("/books", authenticate, canReadBooks, controller.listBooks.bind(controller));
router.get("/books/:id", authenticate, canReadBooks, controller.getBook.bind(controller));
router.post("/books", authenticate, canManageBooks, controller.createBook.bind(controller));
router.patch("/books/:id", authenticate, canManageBooks, controller.updateBook.bind(controller));
router.delete("/books/:id", authenticate, canManageBooks, controller.removeBook.bind(controller));
router.post("/books/:id/copies", authenticate, canManageBooks, controller.addCopies.bind(controller));

router.post("/book-copies", authenticate, canManageBooks, controller.createCopy.bind(controller));
router.patch("/book-copies/:id", authenticate, canManageBooks, controller.updateCopy.bind(controller));
router.delete("/book-copies/:id", authenticate, canManageBooks, controller.removeCopy.bind(controller));

router.get("/loans", authenticate, canManageLoans, controller.listLoans.bind(controller));
router.post("/loans", authenticate, canManageLoans, controller.createLoan.bind(controller));
router.post("/loans/:id/return", authenticate, canManageLoans, controller.returnLoan.bind(controller));
router.patch("/loans/:id", authenticate, canManageLoans, controller.updateLoan.bind(controller));
router.delete("/loans/:id", authenticate, canManageLoans, controller.removeLoan.bind(controller));

export default router;
