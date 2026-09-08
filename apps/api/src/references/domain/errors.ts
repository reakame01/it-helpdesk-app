export const KNOWN_CATALOG_CODES = [
  "departments",
  "categories",
  "skills",
] as const;

export type KnownCatalogCode = (typeof KNOWN_CATALOG_CODES)[number];

const CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

export function normalizeReferenceCode(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertValidReferenceCode(code: string): void {
  if (!CODE_PATTERN.test(code)) {
    throw new InvalidReferenceCodeError(code);
  }
}

export class CatalogNotFoundError extends Error {
  constructor(public readonly catalogCode: string) {
    super(`Reference catalog not found: ${catalogCode}`);
    this.name = "CatalogNotFoundError";
  }
}

export class ReferenceItemNotFoundError extends Error {
  constructor(public readonly itemId: string) {
    super(`Reference item not found: ${itemId}`);
    this.name = "ReferenceItemNotFoundError";
  }
}

export class DuplicateReferenceCodeError extends Error {
  constructor(
    public readonly catalogCode: string,
    public readonly itemCode: string,
  ) {
    super(
      `Reference code "${itemCode}" already exists in catalog "${catalogCode}"`,
    );
    this.name = "DuplicateReferenceCodeError";
  }
}

export class InvalidReferenceCodeError extends Error {
  constructor(public readonly code: string) {
    super(
      `Invalid reference code "${code}". Use lowercase letters, numbers, underscore; start with a letter.`,
    );
    this.name = "InvalidReferenceCodeError";
  }
}
