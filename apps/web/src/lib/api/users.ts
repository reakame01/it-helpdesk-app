import type {
  CreateManagedUserDto,
  OnDutyStaffDto,
  ResetManagedUserPasswordResultDto,
  UpdateManagedUserDto,
  UserDto,
} from "@helpdesk/types";
import { apiClient } from "./client";

export async function fetchOnDutyStaff() {
  const { data } = await apiClient.get<OnDutyStaffDto[]>("/users/on-duty");
  return data;
}

export async function fetchManagedUsers() {
  const { data } = await apiClient.get<UserDto[]>("/users");
  return data;
}

export async function createManagedUser(body: CreateManagedUserDto) {
  const { data } = await apiClient.post<UserDto>("/users", body);
  return data;
}

export async function updateManagedUser(id: string, body: UpdateManagedUserDto) {
  const { data } = await apiClient.patch<UserDto>(`/users/${id}`, body);
  return data;
}

export async function resetManagedUserPassword(
  id: string,
  password?: string,
) {
  const { data } = await apiClient.post<ResetManagedUserPasswordResultDto>(
    `/users/${id}/reset-password`,
    password ? { password } : {},
  );
  return data;
}

export async function deleteManagedUser(id: string) {
  await apiClient.delete(`/users/${id}`);
}
