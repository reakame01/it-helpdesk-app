import type { User } from "../../domain/user.entity";
import type { UserRepository } from "../ports/user.repository";

export class ListManagedUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(): Promise<User[]> {
    return this.users.listManagedUsers();
  }
}
