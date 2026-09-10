import type { ReferenceCatalog } from "../../domain/reference-catalog.entity";
import type { ReferenceRepository } from "../ports/reference.repository";

export class ListCatalogsUseCase {
  constructor(private readonly references: ReferenceRepository) {}

  execute(): Promise<ReferenceCatalog[]> {
    return this.references.listCatalogs();
  }
}
