"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MaterialIcon } from "@/components/shared/material-icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const profileUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA_NePHXteXZ9yx7SIbUFiB0Y_Ny-CmxDPgqTJ4X35kPBr_q7zs_4d2-ZRM25dLefYhTZEAu3w8jQKcJAPAACSo8IWJW4wGuO0jvrlOsRd14qtTrsi27hLBJTleGKCG8pt__HLkPT3loKvwnuH72YM4mJBp6qt5bu1tjmNYzbpX-Yyax0yuX63Lmqs0hr-6Nkew0Jn_59RNYBB3y-OunQPWDqAZMZFjonan5266dgGrNL89QkY8Sow";

export function PortalHeader() {
  const t = useTranslations();
  const [search, setSearch] = useState("");

  const navItems = [
    { href: "/", label: t("nav.userPortal"), active: true },
    { href: "#", label: t("nav.itWorkspace"), active: false },
    { href: "#", label: t("nav.quickTicket"), active: false },
    { href: "#", label: t("nav.gmDashboard"), active: false },
  ] as const;

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

          <button
            aria-label={t("common.notifications")}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            type="button"
          >
            <MaterialIcon className="text-[22px]" name="notifications" />
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 font-label-md text-[10px] font-bold text-on-error">
              3
            </span>
          </button>

          <div className="flex items-center gap-space-xs pl-space-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover"
              src={profileUrl}
            />
            <div className="hidden flex-col text-left lg:flex">
              <span className="font-label-lg text-label-lg leading-tight text-on-surface">
                {t("header.profileName")}
              </span>
              <button
                className="flex cursor-pointer items-center gap-1 font-label-md text-label-md font-semibold text-primary hover:underline"
                type="button"
              >
                {t("header.switchMode")}
                <MaterialIcon className="text-[14px]" name="swap_horiz" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(11,28,48,0.03)]">
        <div className="mx-auto max-w-container-max px-gutter-desktop">
          <nav className="flex items-center gap-space-lg overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap py-space-sm transition-colors",
                  item.active
                    ? "border-b-2 border-primary font-bold text-primary"
                    : "font-title-md text-title-md text-on-surface-variant hover:text-on-surface",
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
