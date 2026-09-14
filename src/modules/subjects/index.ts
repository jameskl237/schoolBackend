export { default as subjectRouter } from "./subject.routes.js";

export { SubjectController } from "./subject.controller.js";
export { SubjectService } from "./subject.service.js";
export { SubjectRepository } from "./subject.repository.js";
export {
  createSubjectSchema,
  updateSubjectSchema,
  type CreateSubjectInput,
  type UpdateSubjectInput,
} from "./subject.dto.js";
