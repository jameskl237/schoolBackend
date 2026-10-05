import fs from "node:fs";
import path from "node:path";

import multer from "multer";

import { AppError } from "../errors/app-error.js";

/**
 * Stockage local des épreuves PDF. On enregistre en base le chemin relatif
 * (portable), on ne sert le fichier que via une route authentifiée qui vérifie
 * le droit de consultation (enseignant, élève concerné ou parent concerné).
 */
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const EXAM_PAPER_DIR = "evaluations";
const EXAM_PAPER_PUBLIC_DIR = path.posix.join("uploads", EXAM_PAPER_DIR);

const absoluteDir = () => path.join(UPLOADS_ROOT, EXAM_PAPER_DIR);

const ensureExamPaperDir = () => {
  fs.mkdirSync(absoluteDir(), { recursive: true });
};

export const MAX_EXAM_PAPER_BYTES = 10 * 1024 * 1024;

export const examPaperUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      ensureExamPaperDir();
      callback(null, absoluteDir());
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || ".pdf";
      const unique = `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}`;
      callback(null, `exam-paper-${unique}${extension}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname);

    if (!isPdf) {
      callback(new AppError("Seules les épreuves au format PDF sont acceptées", 400, "INVALID_FILE_TYPE"));
      return;
    }

    callback(null, true);
  },
  limits: { fileSize: MAX_EXAM_PAPER_BYTES },
});

/** Chemin relatif à stocker en base (sép. `/` portable). */
export const examPaperStoredPath = (filename: string): string =>
  path.posix.join(EXAM_PAPER_PUBLIC_DIR, filename);

/** Chemin absolu sur disque depuis le chemin relatif stocké. */
export const examPaperAbsolutePath = (storedPath: string): string =>
  path.join(process.cwd(), storedPath);

/** Supprime le fichier, sans jamais sortir du dossier uploads. */
export const removeExamPaperFile = (storedPath: string): void => {
  const absolute = path.normalize(examPaperAbsolutePath(storedPath));
  const root = path.normalize(UPLOADS_ROOT);

  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    return;
  }

  fs.rmSync(absolute, { force: true });
};

export const sanitizeExamPaperName = (name: string): string => path.basename(name);