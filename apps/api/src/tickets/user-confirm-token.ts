import { createHash, randomBytes } from "node:crypto";

export const USER_CONFIRM_TOKEN_TTL_MS = 60 * 60 * 1000;

export type ConfirmTokenStage = "AWAITING_USER_TEST" | "RESOLVED";

export function hashConfirmToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export function issueConfirmTokenPlain(): {
  plain: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const plain = randomBytes(32).toString("hex");
  return {
    plain,
    tokenHash: hashConfirmToken(plain),
    expiresAt: new Date(Date.now() + USER_CONFIRM_TOKEN_TTL_MS),
  };
}

export function buildConfirmDeepLink(input: {
  webBaseUrl: string;
  locale: string;
  ticketId: string;
  token: string;
}): string {
  const base = input.webBaseUrl.replace(/\/$/, "");
  const locale = input.locale || "th";
  return `${base}/${locale}/it?ticket=${encodeURIComponent(input.ticketId)}&token=${encodeURIComponent(input.token)}`;
}
