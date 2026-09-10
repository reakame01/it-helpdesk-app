import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  CatalogNotFoundError,
  DuplicateReferenceCodeError,
  InvalidReferenceCodeError,
  ReferenceItemNotFoundError,
} from "../../domain/errors";

export function mapReferenceError(error: unknown): never {
  if (error instanceof CatalogNotFoundError) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof ReferenceItemNotFoundError) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof DuplicateReferenceCodeError) {
    throw new ConflictException(error.message);
  }
  if (error instanceof InvalidReferenceCodeError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
