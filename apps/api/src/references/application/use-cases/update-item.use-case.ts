import {
  DuplicateReferenceCodeError,
  normalizeReferenceCode,
  ReferenceItemNotFoundError,
} from "../../domain/errors";
import type { ReferenceItem } from "../../domain/reference-item.entity";
import { ReferenceItem as ReferenceItemEntity } from "../../domain/reference-item.entity";
import type { ReferenceRepository } from "../ports/reference.repository";

export type UpdateItemInput = {
  itemId: string;
  code?: string;
  labelTh?: string;
  labelEn?: string;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export class UpdateItemUseCase {
  constructor(private readonly references: ReferenceRepository) {}

  async execute(input: UpdateItemInput): Promise<ReferenceItem> {
    const existing = await this.references.findItemById(input.itemId);
    if (!existing) {
      throw new ReferenceItemNotFoundError(input.itemId);
    }

    const draft = new ReferenceItemEntity({
      id: existing.id,
      catalogId: existing.catalogId,
      catalogCode: existing.catalogCode,
      code: existing.code,
      labelTh: existing.labelTh,
      labelEn: existing.labelEn,
      icon: existing.icon,
      isActive: existing.isActive,
      sortOrder: existing.sortOrder,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    });
    draft.applyUpdate({
      code: input.code,
      labelTh: input.labelTh,
      labelEn: input.labelEn,
      icon: input.icon,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    });

    if (input.code !== undefined) {
      const code = normalizeReferenceCode(input.code);
      const exists = await this.references.existsItemCode(
        existing.catalogId,
        code,
        existing.id,
      );
      if (exists) {
        throw new DuplicateReferenceCodeError(existing.catalogCode, code);
      }
    }

    return this.references.updateItem(existing.id, {
      code: input.code,
      labelTh: input.labelTh,
      labelEn: input.labelEn,
      icon: input.icon,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    });
  }
}
