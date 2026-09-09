"use client";

import type { OnDutyStaffDto } from "@helpdesk/types";
import { useLocale, useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";
import { SafeAvatar } from "@/components/shared/safe-avatar";
import { resolveMediaUrl } from "@/lib/api";
import {
  staffDisplayName,
  useOnDutyStaff,
} from "@/lib/hooks/use-on-duty-staff";

type ItStaffPanelProps = {
  /** When provided by the parent, skips an extra fetch. */
  members?: OnDutyStaffDto[];
  loading?: boolean;
  error?: boolean;
};

export function ItStaffPanel({
  members: membersProp,
  loading: loadingProp,
  error: errorProp,
}: ItStaffPanelProps = {}) {
  const t = useTranslations("portal.staff");
  const tRoles = useTranslations("users.roles");
  const locale = useLocale();
  const shouldFetch = membersProp === undefined;
  const fetched = useOnDutyStaff({ enabled: shouldFetch });

  const members = membersProp ?? fetched.members;
  const loading = loadingProp ?? (shouldFetch ? fetched.loading : false);
  const error = errorProp ?? (shouldFetch ? fetched.error : false);

  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <MaterialIcon className="text-[24px] text-secondary" name="group" />
          <h3 className="font-headline-sm text-headline-sm text-primary">
            {t("title")}
          </h3>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-secondary-fixed px-space-xs py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed-variant">
          <span className="h-2 w-2 rounded-full bg-secondary" />{" "}
          {t("count", { count: members.length })}
        </span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("description")}
      </p>
      {loading ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("loading")}
        </p>
      ) : error ? (
        <p className="font-body-sm text-body-sm text-error">{t("loadError")}</p>
      ) : members.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("empty")}
        </p>
      ) : (
        members.map((staff) => {
          const name = staffDisplayName(staff, locale);
          const specialty = staff.jobTitle?.trim() || tRoles(staff.role);
          const extension = staff.extension?.trim()
            ? t("extension", { ext: staff.extension.trim() })
            : "—";

          return (
            <div
              key={staff.id}
              className="flex items-center justify-between rounded-lg bg-surface-container-low p-space-sm shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-space-sm">
                <SafeAvatar
                  alt={name}
                  className="h-11 w-11 shrink-0 rounded-full shadow-sm"
                  src={resolveMediaUrl(staff.avatarUrl)}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-label-md text-label-md font-bold text-on-surface">
                    {name}
                  </span>
                  <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
                    {specialty}
                  </span>
                </div>
              </div>
              <span className="ml-space-xs shrink-0 rounded-md bg-surface-container-lowest px-space-xs py-1 font-headline-sm text-headline-sm font-bold text-primary shadow-sm">
                {extension}
              </span>
            </div>
          );
        })
      )}
      <div className="flex items-center gap-space-xs rounded-lg bg-surface-container-highest p-space-sm text-on-surface">
        <MaterialIcon
          className="shrink-0 text-[20px] text-primary"
          name="access_time"
        />
        <span className="font-body-sm text-body-sm">{t("hours")}</span>
      </div>
    </div>
  );
}
