import {
  UserNotFoundError,
  WeakPasswordError,
  WrongCurrentPasswordError,
} from "../../domain/errors";
import type { PasswordHasher } from "../ports/password-hasher";
import type { UserRepository } from "../ports/user.repository";

export type ChangeOwnPasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export class ChangeOwnPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: ChangeOwnPasswordInput): Promise<void> {
    const auth = await this.users.findAuthById(input.userId);
    if (!auth || !auth.isActive) {
      throw new UserNotFoundError(input.userId);
    }

    const valid = await this.passwords.compare(
      input.currentPassword,
      auth.passwordHash,
    );
    if (!valid) {
      throw new WrongCurrentPasswordError();
    }

    const next = input.newPassword.trim();
    if (next.length < 8) {
      throw new WeakPasswordError();
    }

    const passwordHash = await this.passwords.hash(next);
    await this.users.updatePasswordHash(auth.id, passwordHash);
  }
}
