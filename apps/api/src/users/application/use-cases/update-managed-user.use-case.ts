import {
  DuplicateEmployeeIdError,
  DuplicateUserEmailError,
  InvalidManagedRoleError,
  isManagedUserRole,
  UserNotFoundError,
} from "../../domain/errors";
import type { User } from "../../domain/user.entity";
import type { UserRepository } from "../ports/user.repository";

export type UpdateManagedUserInput = {
  userId: string;
  email?: string;
  nameTh?: string;
  nameEn?: string;
  role?: string;
  employeeId?: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
};

export class UpdateManagedUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdateManagedUserInput): Promise<User> {
    const existing = await this.users.findById(input.userId);
    if (!existing || !existing.managedRole || existing.deletedAt) {
      throw new UserNotFoundError(input.userId);
    }

    if (input.role !== undefined && !isManagedUserRole(input.role)) {
      throw new InvalidManagedRoleError(input.role);
    }

    const email =
      input.email !== undefined ? input.email.trim().toLowerCase() : undefined;
    const employeeId =
      input.employeeId !== undefined ? input.employeeId.trim() : undefined;
    const nameTh =
      input.nameTh !== undefined ? input.nameTh.trim() : undefined;
    const nameEn =
      input.nameEn !== undefined ? input.nameEn.trim() : undefined;

    if (email && (await this.users.existsEmail(email, existing.id))) {
      throw new DuplicateUserEmailError(email);
    }
    if (
      employeeId &&
      (await this.users.existsEmployeeId(employeeId, existing.id))
    ) {
      throw new DuplicateEmployeeIdError(employeeId);
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
      role: input.role,
      employeeId,
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
      avatarUrl:
        input.avatarUrl !== undefined
          ? input.avatarUrl?.trim() || null
          : undefined,
      isActive: input.isActive,
    });
  }
}
