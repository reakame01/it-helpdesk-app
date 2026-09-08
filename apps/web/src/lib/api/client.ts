import axios, { type AxiosError } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function getApiAccessToken() {
  return accessToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ message?: string | string[] }>;
    const message = ax.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
    if (ax.message) return ax.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}
