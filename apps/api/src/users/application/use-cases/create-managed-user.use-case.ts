import {
  DuplicateEmployeeIdError,
  DuplicateUserEmailError,
  InvalidManagedRoleError,
  isManagedUserRole,
  WeakPasswordError,
} from "../../domain/errors";
import type { User } from "../../domain/user.entity";
import type { PasswordHasher } from "../ports/password-hasher";
import type { UserRepository } from "../ports/user.repository";

export type CreateManagedUserInput = {
  email: string;
  password: string;
  nameTh: string;
  nameEn: string;
  role: string;
  employeeId: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
};

export class CreateManagedUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: CreateManagedUserInput): Promise<User> {
    if (!isManagedUserRole(input.role)) {
      throw new InvalidManagedRoleError(input.role);
    }
    if (input.password.trim().length < 8) {
      throw new WeakPasswordError();
    }

    const email = input.email.trim().toLowerCase();
    const employeeId = input.employeeId.trim();
    const nameTh = input.nameTh.trim();
    const nameEn = input.nameEn.trim();

    if (await this.users.existsEmail(email)) {
      throw new DuplicateUserEmailError(email);
    }
    if (await this.users.existsEmployeeId(employeeId)) {
      throw new DuplicateEmployeeIdError(employeeId);
    }

    const passwordHash = await this.passwords.hash(input.password);

    return this.users.create({
      email,
      passwordHash,
      name: nameTh || nameEn,
      nameTh,
      nameEn,
      role: input.role,
      employeeId,
      jobTitle: input.jobTitle?.trim() || null,
      extension: input.extension?.trim() || null,
      mobile: input.mobile?.trim() || null,
      avatarUrl: input.avatarUrl?.trim() || null,
      isActive: input.isActive ?? true,
    });
  }
}
