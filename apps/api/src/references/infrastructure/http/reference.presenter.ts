import type {
  ReferenceCatalogDto,
  ReferenceItemDto,
} from "@helpdesk/types";
import type { ReferenceCatalog } from "../../domain/reference-catalog.entity";
import type { ReferenceItem } from "../../domain/reference-item.entity";

export function toCatalogDto(catalog: ReferenceCatalog): ReferenceCatalogDto {
  return {
    id: catalog.id,
    code: catalog.code,
    nameTh: catalog.nameTh,
    nameEn: catalog.nameEn,
    itemCount: catalog.itemCount,
    createdAt: catalog.createdAt.toISOString(),
    updatedAt: catalog.updatedAt.toISOString(),
  };
}

export function toItemDto(item: ReferenceItem): ReferenceItemDto {
  return {
    id: item.id,
    catalogId: item.catalogId,
    catalogCode: item.catalogCode,
    code: item.code,
    labelTh: item.labelTh,
    labelEn: item.labelEn,
    icon: item.icon,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
