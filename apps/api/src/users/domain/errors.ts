export const MANAGED_USER_ROLES = ["IT_STAFF", "SUPERVISOR", "IT_MANAGER"] as const;

export type ManagedUserRole = (typeof MANAGED_USER_ROLES)[number];

export function isManagedUserRole(role: string): role is ManagedUserRole {
  return (MANAGED_USER_ROLES as readonly string[]).includes(role);
}

export class UserNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}

export class DuplicateUserEmailError extends Error {
  constructor(public readonly email: string) {
    super(`Email already in use: ${email}`);
    this.name = "DuplicateUserEmailError";
  }
}

export class DuplicateEmployeeIdError extends Error {
  constructor(public readonly employeeId: string) {
    super(`Employee ID already in use: ${employeeId}`);
    this.name = "DuplicateEmployeeIdError";
  }
}

export class InvalidManagedRoleError extends Error {
  constructor(public readonly role: string) {
    super(`Role is not allowed for managed users: ${role}`);
    this.name = "InvalidManagedRoleError";
  }
}

export class WeakPasswordError extends Error {
  constructor() {
    super("Password must be at least 8 characters");
    this.name = "WeakPasswordError";
  }
}

export class CannotDeleteSelfError extends Error {
  constructor() {
    super("You cannot delete your own account");
    this.name = "CannotDeleteSelfError";
  }
}

export class UserAlreadyDeletedError extends Error {
  constructor(public readonly userId: string) {
    super(`User already deleted: ${userId}`);
    this.name = "UserAlreadyDeletedError";
  }
}

export class WrongCurrentPasswordError extends Error {
  constructor() {
    super("Current password is incorrect");
    this.name = "WrongCurrentPasswordError";
  }
}

export class InvalidAvatarFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAvatarFileError";
  }
}
