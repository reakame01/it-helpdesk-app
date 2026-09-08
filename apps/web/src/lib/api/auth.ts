import type { AuthUserDto, UserDto } from "@helpdesk/types";
import { apiClient } from "./client";

export async function loginRequest(email: string, password: string) {
  const { data } = await apiClient.post<AuthUserDto>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get<UserDto>("/auth/me");
  return data;
}
