import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  DuplicateEmployeeIdError,
  DuplicateUserEmailError,
  InvalidManagedRoleError,
  CannotDeleteSelfError,
  UserAlreadyDeletedError,
  UserNotFoundError,
  WeakPasswordError,
} from "../../domain/errors";

export function mapUserError(error: unknown): never {
  if (error instanceof UserNotFoundError) {
    throw new NotFoundException(error.message);
  }
  if (
    error instanceof DuplicateUserEmailError ||
    error instanceof DuplicateEmployeeIdError ||
    error instanceof UserAlreadyDeletedError
  ) {
    throw new ConflictException(error.message);
  }
  if (
    error instanceof InvalidManagedRoleError ||
    error instanceof WeakPasswordError ||
    error instanceof CannotDeleteSelfError
  ) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
