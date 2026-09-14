export { default as teacherRouter } from "./teacher.routes.js";

export { TeacherController } from "./teacher.controller.js";
export { TeacherService } from "./teacher.service.js";
export { TeacherRepository } from "./teacher.repository.js";
export {
  createTeacherSchema,
  updateTeacherSchema,
  type CreateTeacherInput,
  type UpdateTeacherInput,
} from "./teacher.dto.js";
