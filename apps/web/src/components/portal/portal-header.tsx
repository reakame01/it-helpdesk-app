"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ItStaffRole } from "@/components/auth/it-auth-context";
import { useItAuth } from "@/components/auth/it-auth-context";
import { ItSessionControls } from "@/components/auth/it-session-controls";
import { NotificationMenu } from "@/components/portal/notification-menu";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MaterialIcon } from "@/components/shared/material-icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavKey =
  | "userPortal"
  | "itWorkspace"
  | "userManagement"
  | "dataReferences"
  | "gmDashboard";

type NavItem = {
  href: string;
  key: NavKey;
  label: string;
  /** When set, only signed-in IT roles see the item. */
  roles?: readonly ItStaffRole[];
};

type PortalHeaderProps = {
  activeNav?: NavKey;
};

export function PortalHeader({
  activeNav = "userPortal",
}: PortalHeaderProps) {
  const t = useTranslations();
  const { isAuthenticated, user } = useItAuth();
  const [search, setSearch] = useState("");

  const navItems: NavItem[] = [
    { href: "/", key: "userPortal", label: t("nav.userPortal") },
    {
      href: "/it",
      key: "itWorkspace",
      label: t("nav.itWorkspace"),
    },
    {
      href: "/gm",
      key: "gmDashboard",
      label: t("nav.gmDashboard"),
    },
    {
      href: "/users",
      key: "userManagement",
      label: t("nav.userManagement"),
      roles: ["IT_STAFF", "SUPERVISOR", "IT_MANAGER"],
    },
    {
      href: "/references",
      key: "dataReferences",
      label: t("nav.dataReferences"),
      roles: ["IT_STAFF", "SUPERVISOR", "IT_MANAGER"],
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles?.length) return true;
    if (!isAuthenticated || !user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <header className="fixed top-0 z-50 w-full bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(11,28,48,0.06)] backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-container-max items-center justify-between gap-space-md px-gutter-desktop">
        <BrandLogo />

        <div className="mx-space-md hidden max-w-xl flex-1 md:block">
          <div className="relative flex w-full items-center">
            <MaterialIcon
              className="pointer-events-none absolute left-3 text-[20px] text-outline"
              name="search"
            />
            <input
              className="h-11 w-full rounded-xl bg-surface-container-low pl-10 pr-space-md font-body-sm text-body-sm text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("header.searchPlaceholder")}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-space-md">
          <LanguageSwitcher />

          {isAuthenticated ? <NotificationMenu /> : null}

          <ItSessionControls />
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(11,28,48,0.03)]">
        <div className="mx-auto max-w-container-max px-gutter-desktop">
          <nav className="flex items-center gap-space-lg overflow-x-auto">
            {visibleNavItems.map((item) => {
              const active = item.key === activeNav;
              return (
                <Link
                  key={item.key}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap py-space-sm transition-colors",
                    active
                      ? "border-b-2 border-primary font-bold text-primary"
                      : "font-title-md text-title-md text-on-surface-variant hover:text-on-surface",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
