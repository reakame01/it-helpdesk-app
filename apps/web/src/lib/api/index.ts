import { apiGet, apiPost } from "./client";
import type { AuthUserDto, HealthCheckDto, TicketDto, UserDto } from "@helpdesk/types";

export const healthApi = {
  check: () => apiGet<HealthCheckDto>("/health"),
};

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<AuthUserDto>("/auth/login", { email, password }),
  me: () => apiGet<UserDto>("/auth/me"),
};

export const ticketsApi = {
  list: (status?: string) =>
    apiGet<TicketDto[]>(status ? `/tickets?status=${status}` : "/tickets"),
};
