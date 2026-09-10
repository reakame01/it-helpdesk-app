"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  staffDisplayName,
  useOnDutyStaff,
} from "@/lib/hooks/use-on-duty-staff";

const COPYRIGHT_YEAR = 2026;

export function PortalFooter() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const { members, loading } = useOnDutyStaff();

  const staffLine = useMemo(() => {
    if (loading) return t("staffLineLoading");
    if (members.length === 0) return t("staffLineEmpty");

    const details = members
      .map((member) => {
        const name = staffDisplayName(member, locale);
        const label = member.jobTitle?.trim() || name;
        const ext = member.extension?.trim();
        if (ext) {
          return t("staffItemWithExt", { ext, label });
        }
        return t("staffItemNoExt", { label });
      })
      .join(", ");

    return t("staffLine", { count: members.length, details });
  }, [loading, members, locale, t]);

  return (
    <footer className="mt-space-3xl w-full bg-surface-container-low">
      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-space-md px-gutter-desktop py-space-xl md:flex-row">
        <div className="flex flex-col gap-space-2xs text-center md:text-left">
          <span className="font-headline-sm text-headline-sm text-primary">
            {t("title")}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {staffLine}
          </span>
        </div>
        <div className="flex items-center gap-space-lg text-center md:text-right">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {t("copyright", { year: COPYRIGHT_YEAR })}
          </span>
        </div>
      </div>
    </footer>
  );
}
