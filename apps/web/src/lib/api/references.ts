import type {
  CreateReferenceItemDto,
  ReferenceCatalogDto,
  ReferenceItemDto,
  UpdateReferenceItemDto,
} from "@helpdesk/types";
import { apiClient } from "./client";

export async function fetchReferenceCatalogs() {
  const { data } = await apiClient.get<ReferenceCatalogDto[]>(
    "/references/catalogs",
  );
  return data;
}

export async function fetchReferenceItems(
  catalogCode: string,
  options?: { activeOnly?: boolean },
) {
  const { data } = await apiClient.get<ReferenceItemDto[]>(
    `/references/${catalogCode}/items`,
    {
      params:
        options?.activeOnly === true ? { activeOnly: true } : undefined,
    },
  );
  return data;
}

export async function createReferenceItem(
  catalogCode: string,
  body: CreateReferenceItemDto,
) {
  const { data } = await apiClient.post<ReferenceItemDto>(
    `/references/${catalogCode}/items`,
    body,
  );
  return data;
}

export async function updateReferenceItem(
  id: string,
  body: UpdateReferenceItemDto,
) {
  const { data } = await apiClient.patch<ReferenceItemDto>(
    `/references/items/${id}`,
    body,
  );
  return data;
}

export async function deleteReferenceItem(id: string) {
  await apiClient.delete(`/references/items/${id}`);
}
