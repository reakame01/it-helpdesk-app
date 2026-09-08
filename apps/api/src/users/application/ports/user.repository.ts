import type { ManagedUserRole } from "../../domain/errors";
import type { User, UserAuthRecord } from "../../domain/user.entity";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export type CreateUserPersistInput = {
  email: string;
  passwordHash: string;
  name: string;
  nameTh: string;
  nameEn: string;
  role: ManagedUserRole;
  employeeId: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
};

export type UpdateUserPersistInput = {
  email?: string;
  name?: string;
  nameTh?: string;
  nameEn?: string;
  role?: ManagedUserRole;
  employeeId?: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
};

export interface UserRepository {
  listManagedUsers(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findAuthByEmail(email: string): Promise<UserAuthRecord | null>;
  existsEmail(email: string, excludeId?: string): Promise<boolean>;
  existsEmployeeId(employeeId: string, excludeId?: string): Promise<boolean>;
  create(input: CreateUserPersistInput): Promise<User>;
  update(id: string, input: UpdateUserPersistInput): Promise<User>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  touchLastSignIn(id: string, at?: Date): Promise<void>;
  softDelete(id: string, deletedAt?: Date): Promise<void>;
}
