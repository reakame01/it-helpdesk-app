"use client";

import { useEffect, useState } from "react";
import type { OnDutyStaffDto } from "@helpdesk/types";
import { useLocale } from "next-intl";
import { fetchOnDutyStaff } from "@/lib/api";

function displayName(staff: OnDutyStaffDto, locale: string): string {
  if (locale.startsWith("th")) {
    return (staff.nameTh || staff.name || staff.nameEn || "").trim();
  }
  return (staff.nameEn || staff.name || staff.nameTh || "").trim();
}

const ROLE_SORT_ORDER: Record<OnDutyStaffDto["role"], number> = {
  IT_MANAGER: 0,
  SUPERVISOR: 1,
  IT_STAFF: 2,
};

export function sortOnDutyStaff(
  rows: OnDutyStaffDto[],
  locale: string,
): OnDutyStaffDto[] {
  return [...rows].sort((a, b) => {
    const roleDiff = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
    if (roleDiff !== 0) return roleDiff;
    return displayName(a, locale).localeCompare(displayName(b, locale), locale, {
      sensitivity: "base",
    });
  });
}

export function staffDisplayName(staff: OnDutyStaffDto, locale: string) {
  return displayName(staff, locale);
}

/** Extension list for hotline banner, preserving on-duty sort order. */
export function collectOnDutyExtensions(members: OnDutyStaffDto[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const member of members) {
    const ext = member.extension?.trim();
    if (!ext || seen.has(ext)) continue;
    seen.add(ext);
    result.push(ext);
  }
  return result;
}

export function useOnDutyStaff(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const locale = useLocale();
  const [members, setMembers] = useState<OnDutyStaffDto[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchOnDutyStaff()
      .then((rows) => {
        if (!cancelled) setMembers(sortOnDutyStaff(rows, locale));
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, enabled]);

  return { members, loading, error };
}
