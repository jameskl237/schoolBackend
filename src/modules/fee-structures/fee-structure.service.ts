import { AppError } from "../../common/errors/app-error.js";
import { stripUndefined } from "../../common/utils/strip-undefined.js";
import { AcademicYearRepository } from "../academic-years/academic-year.repository.js";
import { ClassRepository } from "../classes/class.repository.js";
import { FeeTypeRepository } from "../fee-types/fee-type.repository.js";

import type { CreateFeeStructureInput, UpdateFeeStructureInput } from "./fee-structure.dto.js";
import { FeeStructureRepository } from "./fee-structure.repository.js";

interface ReferenceCheck {
  feeTypeId?: number | undefined;
  academicYearId?: number | undefined;
  classId?: number | null | undefined;
}

export class FeeStructureService {
  constructor(
    private readonly feeStructureRepository = new FeeStructureRepository(),
    private readonly feeTypeRepository = new FeeTypeRepository(),
    private readonly academicYearRepository = new AcademicYearRepository(),
    private readonly classRepository = new ClassRepository(),
  ) {}

  list(establishmentId: number, academicYearId?: number) {
    return this.feeStructureRepository.findMany(establishmentId, academicYearId);
  }

  async get(id: number, establishmentId: number) {
    const feeStructure = await this.feeStructureRepository.findById(id, establishmentId);

    if (!feeStructure) {
      throw new AppError("Fee structure not found", 404, "FEE_STRUCTURE_NOT_FOUND");
    }

    return feeStructure;
  }

  private async ensureReferencesExist(input: ReferenceCheck, establishmentId: number) {
    if (input.feeTypeId !== undefined) {
      const feeType = await this.feeTypeRepository.findById(input.feeTypeId, establishmentId);
      if (!feeType) throw new AppError("Fee type not found", 404, "FEE_TYPE_NOT_FOUND");
    }

    if (input.academicYearId !== undefined) {
      const year = await this.academicYearRepository.findById(input.academicYearId, establishmentId);
      if (!year) throw new AppError("Academic year not found", 404, "ACADEMIC_YEAR_NOT_FOUND");
    }

    if (input.classId) {
      const classEntity = await this.classRepository.findById(input.classId, establishmentId);
      if (!classEntity) throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }
  }

  async create(establishmentId: number, input: CreateFeeStructureInput) {
    await this.ensureReferencesExist(input, establishmentId);

    const { feeTypeId, academicYearId, classId, dueDate, ...rest } = input;

    return this.feeStructureRepository.create({
      ...rest,
      ...(dueDate !== undefined ? { dueDate } : {}),
      feeType: { connect: { id: feeTypeId } },
      academicYear: { connect: { id: academicYearId } },
      ...(classId ? { class: { connect: { id: classId } } } : {}),
    });
  }

  async update(id: number, establishmentId: number, input: UpdateFeeStructureInput) {
    await this.get(id, establishmentId);
    await this.ensureReferencesExist(input, establishmentId);

    const { feeTypeId, academicYearId, classId, ...rest } = input;

    return this.feeStructureRepository.update(id, {
      ...stripUndefined(rest),
      ...(feeTypeId !== undefined ? { feeType: { connect: { id: feeTypeId } } } : {}),
      ...(academicYearId !== undefined ? { academicYear: { connect: { id: academicYearId } } } : {}),
      ...(classId !== undefined
        ? { class: classId === null ? { disconnect: true } : { connect: { id: classId } } }
        : {}),
    });
  }

  async remove(id: number, establishmentId: number) {
    await this.get(id, establishmentId);

    return this.feeStructureRepository.delete(id);
  }
}
