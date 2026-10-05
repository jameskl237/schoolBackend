export { default as roleRouter } from "./role.routes.js";

export { RoleController } from "./role.controller.js";
export { RoleService } from "./role.service.js";
export { RoleRepository } from "./role.repository.js";
export {
  createRoleSchema,
  updateRoleSchema,
  setPermissionsSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
  type SetPermissionsInput,
} from "./role.dto.js";
