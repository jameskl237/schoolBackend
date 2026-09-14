import { RoleRepository } from "./role.repository.js";

export class RoleService {
  constructor(private readonly roleRepository = new RoleRepository()) {}

  async list(establishmentId: number) {
    const roles = await this.roleRepository.findMany(establishmentId);

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => rp.permission.code),
    }));
  }
}
