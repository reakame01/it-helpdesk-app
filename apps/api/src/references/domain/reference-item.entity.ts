import {
  assertValidReferenceCode,
  normalizeReferenceCode,
} from "./errors";

export type ReferenceItemProps = {
  id: string;
  catalogId: string;
  catalogCode: string;
  code: string;
  labelTh: string;
  labelEn: string;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateReferenceItemInput = {
  catalogId: string;
  catalogCode: string;
  code: string;
  labelTh: string;
  labelEn: string;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateReferenceItemInput = {
  code?: string;
  labelTh?: string;
  labelEn?: string;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export class ReferenceItem {
  readonly id: string;
  readonly catalogId: string;
  readonly catalogCode: string;
  code: string;
  labelTh: string;
  labelEn: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: ReferenceItemProps) {
    this.id = props.id;
    this.catalogId = props.catalogId;
    this.catalogCode = props.catalogCode;
    this.code = props.code;
    this.labelTh = props.labelTh;
    this.labelEn = props.labelEn;
    this.icon = props.icon ?? null;
    this.isActive = props.isActive;
    this.sortOrder = props.sortOrder;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static createNew(
    id: string,
    input: CreateReferenceItemInput,
    now = new Date(),
  ): ReferenceItem {
    const code = normalizeReferenceCode(input.code);
    assertValidReferenceCode(code);

    return new ReferenceItem({
      id,
      catalogId: input.catalogId,
      catalogCode: input.catalogCode,
      code,
      labelTh: input.labelTh.trim(),
      labelEn: input.labelEn.trim(),
      icon: input.icon?.trim() || null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  applyUpdate(input: UpdateReferenceItemInput, now = new Date()): void {
    if (input.code !== undefined) {
      const code = normalizeReferenceCode(input.code);
      assertValidReferenceCode(code);
      this.code = code;
    }
    if (input.labelTh !== undefined) {
      this.labelTh = input.labelTh.trim();
    }
    if (input.labelEn !== undefined) {
      this.labelEn = input.labelEn.trim();
    }
    if (input.icon !== undefined) {
      this.icon = input.icon?.trim() || null;
    }
    if (input.isActive !== undefined) {
      this.isActive = input.isActive;
    }
    if (input.sortOrder !== undefined) {
      this.sortOrder = input.sortOrder;
    }
    this.updatedAt = now;
  }
}
