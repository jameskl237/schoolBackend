export { default as disciplineRouter } from "./discipline.routes.js";

export { DisciplineController } from "./discipline.controller.js";
export { DisciplineService } from "./discipline.service.js";
export { DisciplineRepository } from "./discipline.repository.js";
export {
  createDisciplineRecordSchema,
  updateDisciplineRecordSchema,
  type CreateDisciplineRecordInput,
  type UpdateDisciplineRecordInput,
} from "./discipline.dto.js";