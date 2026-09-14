export { default as timetableRouter } from "./timetable.routes.js";

export { TimetableController } from "./timetable.controller.js";
export { TimetableService } from "./timetable.service.js";
export { TimetableRepository } from "./timetable.repository.js";
export {
  createTimetableSchema,
  updateTimetableSchema,
  type CreateTimetableInput,
  type UpdateTimetableInput,
} from "./timetable.dto.js";
