import { defineRouting } from "next-intl/routing";
import { locales } from "./locales";

export type { AppLocale } from "./locales";
export { localeOptions, getLocaleOption } from "./locales";

export const routing = defineRouting({
  locales,
  defaultLocale: "th",
  localePrefix: "always",
});
