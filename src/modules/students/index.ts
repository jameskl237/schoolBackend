export { default as studentRouter } from "./student.routes.js";

export { StudentController } from "./student.controller.js";
export { StudentService } from "./student.service.js";
export { StudentRepository } from "./student.repository.js";
export {
  createStudentSchema,
  updateStudentSchema,
  updateStudentEnrollmentSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
  type UpdateStudentEnrollmentInput,
} from "./student.dto.js";
