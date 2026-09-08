import { ReferenceItemNotFoundError } from "../../domain/errors";
import type { ReferenceRepository } from "../ports/reference.repository";

export class DeleteItemUseCase {
  constructor(private readonly references: ReferenceRepository) {}

  async execute(itemId: string): Promise<void> {
    const existing = await this.references.findItemById(itemId);
    if (!existing) {
      throw new ReferenceItemNotFoundError(itemId);
    }

    await this.references.deleteItem(itemId);
  }
}
