import { CatalogNotFoundError } from "../../domain/errors";
import type { ReferenceItem } from "../../domain/reference-item.entity";
import type { ReferenceRepository } from "../ports/reference.repository";

export type ListItemsInput = {
  catalogCode: string;
  activeOnly?: boolean;
};

export class ListItemsUseCase {
  constructor(private readonly references: ReferenceRepository) {}

  async execute(input: ListItemsInput): Promise<ReferenceItem[]> {
    const catalog = await this.references.findCatalogByCode(input.catalogCode);
    if (!catalog) {
      throw new CatalogNotFoundError(input.catalogCode);
    }

    return this.references.listItems({
      catalogCode: catalog.code,
      activeOnly: input.activeOnly,
    });
  }
}
