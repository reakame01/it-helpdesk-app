import {
  UserNotFoundError,
  WeakPasswordError,
} from "../../domain/errors";
import type { User } from "../../domain/user.entity";
import type { PasswordHasher } from "../ports/password-hasher";
import type { UserRepository } from "../ports/user.repository";

export type ResetPasswordInput = {
  userId: string;
  password?: string;
};

export type ResetPasswordResult = {
  user: User;
  temporaryPassword: string;
};

function generateTempPassword(length = 10): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export class ResetManagedUserPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    const existing = await this.users.findById(input.userId);
    if (!existing || !existing.managedRole || existing.deletedAt) {
      throw new UserNotFoundError(input.userId);
    }

    const temporaryPassword =
      input.password?.trim() || generateTempPassword();
    if (temporaryPassword.length < 8) {
      throw new WeakPasswordError();
    }

    const passwordHash = await this.passwords.hash(temporaryPassword);
    await this.users.updatePasswordHash(existing.id, passwordHash);
    const user = await this.users.findById(existing.id);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return { user, temporaryPassword };
  }
}
