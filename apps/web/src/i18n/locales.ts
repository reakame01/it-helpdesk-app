/**
 * Single source of truth for app locales.
 * To add Japanese later:
 * 1. Append `{ code: "ja", label: "日本語", shortLabel: "JA" }`
 * 2. Add `messages/ja.json`
 * 3. Restart the next-intl middleware (locales come from here)
 */
export const localeOptions = [
  { code: "th", label: "ไทย", shortLabel: "TH" },
  { code: "en", label: "English", shortLabel: "EN" },
] as const;

export type AppLocale = (typeof localeOptions)[number]["code"];

export const locales = localeOptions.map((item) => item.code) as [
  AppLocale,
  ...AppLocale[],
];

export function getLocaleOption(code: string) {
  return localeOptions.find((item) => item.code === code) ?? localeOptions[0];
}
