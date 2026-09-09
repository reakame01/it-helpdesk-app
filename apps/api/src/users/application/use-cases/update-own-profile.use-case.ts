import {
  DuplicateUserEmailError,
  UserNotFoundError,
} from "../../domain/errors";
import type { User } from "../../domain/user.entity";
import type { UserRepository } from "../ports/user.repository";

export type UpdateOwnProfileInput = {
  userId: string;
  email?: string;
  nameTh?: string;
  nameEn?: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
};

export class UpdateOwnProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdateOwnProfileInput): Promise<User> {
    const existing = await this.users.findById(input.userId);
    if (!existing || !existing.managedRole || existing.deletedAt) {
      throw new UserNotFoundError(input.userId);
    }

    const email =
      input.email !== undefined ? input.email.trim().toLowerCase() : undefined;
    const nameTh =
      input.nameTh !== undefined ? input.nameTh.trim() : undefined;
    const nameEn =
      input.nameEn !== undefined ? input.nameEn.trim() : undefined;

    if (email && (await this.users.existsEmail(email, existing.id))) {
      throw new DuplicateUserEmailError(email);
    }

    const nextNameTh = nameTh ?? existing.nameTh ?? "";
    const nextNameEn = nameEn ?? existing.nameEn ?? "";

    return this.users.update(existing.id, {
      email,
      name:
        nameTh !== undefined || nameEn !== undefined
          ? nextNameTh || nextNameEn || existing.name
          : undefined,
      nameTh,
      nameEn,
      jobTitle:
        input.jobTitle !== undefined
          ? input.jobTitle?.trim() || null
          : undefined,
      extension:
        input.extension !== undefined
          ? input.extension?.trim() || null
          : undefined,
      mobile:
        input.mobile !== undefined ? input.mobile?.trim() || null : undefined,
    });
  }
}
