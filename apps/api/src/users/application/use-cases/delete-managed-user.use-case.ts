import {
  CannotDeleteSelfError,
  UserAlreadyDeletedError,
  UserNotFoundError,
} from "../../domain/errors";
import type { UserRepository } from "../ports/user.repository";

export type DeleteManagedUserInput = {
  userId: string;
  actorId: string;
};

export class DeleteManagedUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: DeleteManagedUserInput): Promise<void> {
    if (input.userId === input.actorId) {
      throw new CannotDeleteSelfError();
    }

    const existing = await this.users.findById(input.userId);
    if (!existing || !existing.managedRole) {
      throw new UserNotFoundError(input.userId);
    }
    if (existing.deletedAt) {
      throw new UserAlreadyDeletedError(input.userId);
    }

    await this.users.softDelete(input.userId);
  }
}
