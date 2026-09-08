import { Injectable } from "@nestjs/common";
import type { ReferenceCatalog as PrismaCatalog, ReferenceItem as PrismaItem } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ReferenceCatalog } from "../../domain/reference-catalog.entity";
import {
  assertValidReferenceCode,
  normalizeReferenceCode,
} from "../../domain/errors";
import {
  ReferenceItem,
  type CreateReferenceItemInput,
  type UpdateReferenceItemInput,
} from "../../domain/reference-item.entity";
import type {
  ListItemsQuery,
  ReferenceRepository,
} from "../../application/ports/reference.repository";

type ItemWithCatalog = PrismaItem & {
  catalog: Pick<PrismaCatalog, "code">;
};

@Injectable()
export class PrismaReferenceRepository implements ReferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCatalogs(): Promise<ReferenceCatalog[]> {
    const rows = await this.prisma.referenceCatalog.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { code: "asc" },
    });

    return rows.map(
      (row) =>
        new ReferenceCatalog({
          id: row.id,
          code: row.code,
          nameTh: row.nameTh,
          nameEn: row.nameEn,
          itemCount: row._count.items,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }),
    );
  }

  async findCatalogByCode(code: string): Promise<ReferenceCatalog | null> {
    const row = await this.prisma.referenceCatalog.findUnique({
      where: { code: normalizeReferenceCode(code) },
      include: { _count: { select: { items: true } } },
    });
    if (!row) return null;

    return new ReferenceCatalog({
      id: row.id,
      code: row.code,
      nameTh: row.nameTh,
      nameEn: row.nameEn,
      itemCount: row._count.items,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async listItems(query: ListItemsQuery): Promise<ReferenceItem[]> {
    const rows = await this.prisma.referenceItem.findMany({
      where: {
        catalog: { code: normalizeReferenceCode(query.catalogCode) },
        ...(query.activeOnly ? { isActive: true } : {}),
      },
      include: { catalog: { select: { code: true } } },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findItemById(id: string): Promise<ReferenceItem | null> {
    const row = await this.prisma.referenceItem.findUnique({
      where: { id },
      include: { catalog: { select: { code: true } } },
    });
    return row ? this.toDomain(row) : null;
  }

  async existsItemCode(
    catalogId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const row = await this.prisma.referenceItem.findFirst({
      where: {
        catalogId,
        code: normalizeReferenceCode(code),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async createItem(input: CreateReferenceItemInput): Promise<ReferenceItem> {
    const code = normalizeReferenceCode(input.code);
    assertValidReferenceCode(code);

    const row = await this.prisma.referenceItem.create({
      data: {
        catalogId: input.catalogId,
        code,
        labelTh: input.labelTh.trim(),
        labelEn: input.labelEn.trim(),
        icon: input.icon?.trim() || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
      include: { catalog: { select: { code: true } } },
    });

    return this.toDomain(row);
  }

  async updateItem(
    id: string,
    input: UpdateReferenceItemInput,
  ): Promise<ReferenceItem> {
    const data: {
      code?: string;
      labelTh?: string;
      labelEn?: string;
      icon?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    } = {};

    if (input.code !== undefined) {
      const code = normalizeReferenceCode(input.code);
      assertValidReferenceCode(code);
      data.code = code;
    }
    if (input.labelTh !== undefined) data.labelTh = input.labelTh.trim();
    if (input.labelEn !== undefined) data.labelEn = input.labelEn.trim();
    if (input.icon !== undefined) data.icon = input.icon?.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    const row = await this.prisma.referenceItem.update({
      where: { id },
      data,
      include: { catalog: { select: { code: true } } },
    });

    return this.toDomain(row);
  }

  async deleteItem(id: string): Promise<void> {
    await this.prisma.referenceItem.delete({ where: { id } });
  }

  async nextSortOrder(catalogId: string): Promise<number> {
    const aggregate = await this.prisma.referenceItem.aggregate({
      where: { catalogId },
      _max: { sortOrder: true },
    });
    return (aggregate._max.sortOrder ?? 0) + 1;
  }

  private toDomain(row: ItemWithCatalog): ReferenceItem {
    return new ReferenceItem({
      id: row.id,
      catalogId: row.catalogId,
      catalogCode: row.catalog.code,
      code: row.code,
      labelTh: row.labelTh,
      labelEn: row.labelEn,
      icon: row.icon,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
