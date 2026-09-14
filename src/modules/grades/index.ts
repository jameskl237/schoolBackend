export { default as gradeRouter } from "./grade.routes.js";

export { GradeController } from "./grade.controller.js";
export { GradeService } from "./grade.service.js";
export { GradeRepository } from "./grade.repository.js";
export {
  saveGradesSchema,
  updateGradeSchema,
  type SaveGradesInput,
  type UpdateGradeInput,
} from "./grade.dto.js";
