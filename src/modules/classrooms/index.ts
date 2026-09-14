export { default as classroomRouter } from "./classroom.routes.js";

export { ClassroomController } from "./classroom.controller.js";
export { ClassroomService } from "./classroom.service.js";
export { ClassroomRepository } from "./classroom.repository.js";
export {
  createClassroomSchema,
  updateClassroomSchema,
  type CreateClassroomInput,
  type UpdateClassroomInput,
} from "./classroom.dto.js";
