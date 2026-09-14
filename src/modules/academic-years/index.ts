export { default as academicYearRouter } from "./academic-year.routes.js";

export { AcademicYearController } from "./academic-year.controller.js";
export { AcademicYearService } from "./academic-year.service.js";
export { AcademicYearRepository } from "./academic-year.repository.js";
export {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  type CreateAcademicYearInput,
  type UpdateAcademicYearInput,
} from "./academic-year.dto.js";
