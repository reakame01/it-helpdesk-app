import {
  assertValidReferenceCode,
  CatalogNotFoundError,
  DuplicateReferenceCodeError,
  normalizeReferenceCode,
} from "../../domain/errors";
import type { ReferenceItem } from "../../domain/reference-item.entity";
import type { ReferenceRepository } from "../ports/reference.repository";

export type CreateItemInput = {
  catalogCode: string;
  code: string;
  labelTh: string;
  labelEn: string;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export class CreateItemUseCase {
  constructor(private readonly references: ReferenceRepository) {}

  async execute(input: CreateItemInput): Promise<ReferenceItem> {
    const catalog = await this.references.findCatalogByCode(input.catalogCode);
    if (!catalog) {
      throw new CatalogNotFoundError(input.catalogCode);
    }

    const code = normalizeReferenceCode(input.code);
    assertValidReferenceCode(code);

    const exists = await this.references.existsItemCode(catalog.id, code);
    if (exists) {
      throw new DuplicateReferenceCodeError(catalog.code, code);
    }

    const sortOrder =
      input.sortOrder ?? (await this.references.nextSortOrder(catalog.id));

    return this.references.createItem({
      catalogId: catalog.id,
      catalogCode: catalog.code,
      code,
      labelTh: input.labelTh,
      labelEn: input.labelEn,
      icon: input.icon,
      isActive: input.isActive,
      sortOrder,
    });
  }
}
