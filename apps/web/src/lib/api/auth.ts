import type {
  ChangeOwnPasswordDto,
  UpdateOwnProfileDto,
  UserDto,
  AuthUserDto,
} from "@helpdesk/types";
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

export async function updateOwnProfile(payload: UpdateOwnProfileDto) {
  const { data } = await apiClient.patch<UserDto>("/auth/me", payload);
  return data;
}

export async function changeOwnPassword(payload: ChangeOwnPasswordDto) {
  await apiClient.post("/auth/me/password", payload);
}

export async function uploadOwnAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<UserDto>("/auth/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: [
      (body, headers) => {
        if (body instanceof FormData && headers) {
          // Let the runtime set multipart boundary (override JSON default).
          delete headers["Content-Type"];
        }
        return body;
      },
    ],
  });
  return data;
}

export async function deleteOwnAvatar() {
  const { data } = await apiClient.delete<UserDto>("/auth/me/avatar");
  return data;
}

const apiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

/** Resolve stored avatar paths (files/...) to absolute API URLs for <img src>. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  // App-public assets (e.g. /default-avatar.svg) stay on the web origin.
  if (url.startsWith("/") && !url.startsWith("/files/") && !url.startsWith("/api/")) {
    return url;
  }
  const path = url.replace(/^\/+/, "");
  return `${apiBase}/${path}`;
}
