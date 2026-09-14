import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";

import type { UpdateEstablishmentInput } from "./establishment.dto.js";
import { EstablishmentRepository } from "./establishment.repository.js";

export class EstablishmentService {
  constructor(private readonly establishmentRepository = new EstablishmentRepository()) {}

  async get(id: number) {
    const establishment = await this.establishmentRepository.findById(id);

    if (!establishment) {
      throw new AppError("Establishment not found", 404, "ESTABLISHMENT_NOT_FOUND");
    }

    const { _count, ...rest } = establishment;

    return {
      ...rest,
      counts: {
        users: _count.users,
        students: _count.students,
        classrooms: _count.classrooms,
        teachers: _count.teachers,
      },
    };
  }

  async update(id: number, input: UpdateEstablishmentInput) {
    await this.get(id);

    return this.establishmentRepository.update(id, stripUndefined(input));
  }
}
