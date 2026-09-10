import type { ReferenceCatalog } from "../../domain/reference-catalog.entity";
import type {
  CreateReferenceItemInput,
  ReferenceItem,
  UpdateReferenceItemInput,
} from "../../domain/reference-item.entity";

export const REFERENCE_REPOSITORY = Symbol("REFERENCE_REPOSITORY");

export interface ListItemsQuery {
  catalogCode: string;
  activeOnly?: boolean;
}

export interface ReferenceRepository {
  listCatalogs(): Promise<ReferenceCatalog[]>;
  findCatalogByCode(code: string): Promise<ReferenceCatalog | null>;
  listItems(query: ListItemsQuery): Promise<ReferenceItem[]>;
  findItemById(id: string): Promise<ReferenceItem | null>;
  existsItemCode(catalogId: string, code: string, excludeId?: string): Promise<boolean>;
  createItem(input: CreateReferenceItemInput): Promise<ReferenceItem>;
  updateItem(id: string, input: UpdateReferenceItemInput): Promise<ReferenceItem>;
  deleteItem(id: string): Promise<void>;
  nextSortOrder(catalogId: string): Promise<number>;
}
