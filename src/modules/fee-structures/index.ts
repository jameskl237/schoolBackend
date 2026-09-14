export { default as feeStructureRouter } from "./fee-structure.routes.js";

export { FeeStructureController } from "./fee-structure.controller.js";
export { FeeStructureService } from "./fee-structure.service.js";
export { FeeStructureRepository } from "./fee-structure.repository.js";
export {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  type CreateFeeStructureInput,
  type UpdateFeeStructureInput,
} from "./fee-structure.dto.js";
