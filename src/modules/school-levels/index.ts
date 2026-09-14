export { default as schoolLevelRouter } from "./school-level.routes.js";

export { SchoolLevelController } from "./school-level.controller.js";
export { SchoolLevelService } from "./school-level.service.js";
export { SchoolLevelRepository } from "./school-level.repository.js";
export {
  createSchoolLevelSchema,
  updateSchoolLevelSchema,
  type CreateSchoolLevelInput,
  type UpdateSchoolLevelInput,
} from "./school-level.dto.js";
