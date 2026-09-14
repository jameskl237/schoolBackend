export { default as feeTypeRouter } from "./fee-type.routes.js";

export { FeeTypeController } from "./fee-type.controller.js";
export { FeeTypeService } from "./fee-type.service.js";
export { FeeTypeRepository } from "./fee-type.repository.js";
export {
  createFeeTypeSchema,
  updateFeeTypeSchema,
  type CreateFeeTypeInput,
  type UpdateFeeTypeInput,
} from "./fee-type.dto.js";
