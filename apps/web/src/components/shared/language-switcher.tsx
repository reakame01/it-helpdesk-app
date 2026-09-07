"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  getLocaleOption,
  localeOptions,
  type AppLocale,
} from "@/i18n/locales";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  /** `compact` for app bar; `full` for login / wider layouts */
  variant?: "compact" | "full";
  className?: string;
};

export function LanguageSwitcher({
  variant = "compact",
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = getLocaleOption(locale);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function switchTo(next: AppLocale) {
    setOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("language")}
        className={cn(
          "flex h-11 items-center gap-1.5 rounded-xl bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface",
          variant === "compact" ? "min-w-11 px-2.5" : "px-3",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <MaterialIcon className="text-[20px]" name="language" />
        <span className="font-label-md text-label-md font-bold">
          {variant === "full" ? current.label : current.shortLabel}
        </span>
        <MaterialIcon
          className={cn(
            "text-[18px] transition-transform",
            open && "rotate-180",
          )}
          name="expand_more"
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("language")}
          className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-1 shadow-lg"
        >
          {localeOptions.map((option) => {
            const selected = option.code === locale;
            return (
              <button
                key={option.code}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left font-label-md text-label-md transition-colors hover:bg-surface-container",
                  selected
                    ? "bg-surface-container-low font-bold text-primary"
                    : "text-on-surface",
                )}
                onClick={() => switchTo(option.code)}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex w-7 justify-center rounded-md bg-surface-container px-1 py-0.5 text-[11px] font-bold text-on-surface-variant">
                    {option.shortLabel}
                  </span>
                  {option.label}
                </span>
                {selected ? (
                  <MaterialIcon className="text-[18px]" name="check" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
