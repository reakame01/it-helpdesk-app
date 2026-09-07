"use client";

import { useTranslations } from "next-intl";

export function PortalFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-space-3xl w-full bg-surface-container-low">
      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-space-md px-gutter-desktop py-space-xl md:flex-row">
        <div className="flex flex-col gap-space-2xs text-center md:text-left">
          <span className="font-headline-sm text-headline-sm text-primary">
            {t("title")}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {t("staffLine")}
          </span>
        </div>
        <div className="flex items-center gap-space-lg text-center md:text-right">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {t("copyright")}
          </span>
        </div>
      </div>
    </footer>
  );
}
