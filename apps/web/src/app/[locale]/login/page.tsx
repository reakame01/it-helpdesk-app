"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MaterialIcon } from "@/components/shared/material-icon";
import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-container-max items-center justify-between px-gutter-desktop py-space-md">
        <BrandLogo />
        <LanguageSwitcher variant="full" />
      </div>

      <main className="flex flex-1 items-center justify-center px-gutter-desktop py-space-xl">
        <div className="w-full max-w-md">
          <div className="mb-space-lg flex flex-col gap-space-2xs text-center">
            <div className="mx-auto mb-space-sm flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary shadow-sm">
              <MaterialIcon className="text-[32px]" name="lock" />
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
              {t("title")}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t("subtitle")}
            </p>
          </div>

          <form
            className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-sm"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-space-2xs">
              <label
                className="font-label-md text-label-md text-on-surface"
                htmlFor="login-email"
              >
                {t("email")}
              </label>
              <input
                autoComplete="username"
                className="h-target-min w-full rounded-xl bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface outline-none ring-2 ring-transparent transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:ring-secondary"
                id="login-email"
                placeholder={t("emailPlaceholder")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-space-2xs">
              <label
                className="font-label-md text-label-md text-on-surface"
                htmlFor="login-password"
              >
                {t("password")}
              </label>
              <input
                autoComplete="current-password"
                className="h-target-min w-full rounded-xl bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface outline-none ring-2 ring-transparent transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:ring-secondary"
                id="login-password"
                placeholder={t("passwordPlaceholder")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                className="font-label-md text-label-md font-semibold text-primary hover:underline"
                type="button"
              >
                {t("forgot")}
              </button>
            </div>

            <button
              className="flex h-12 w-full items-center justify-center gap-space-xs rounded-xl bg-primary font-label-md text-label-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
              type="submit"
            >
              <MaterialIcon className="text-[20px]" name="login" />
              <span>{t("submit")}</span>
            </button>

            <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
              {t("mockHint")}
            </p>
          </form>

          <div className="mt-space-md text-center">
            <Link
              className="inline-flex items-center gap-space-2xs font-label-md text-label-md font-semibold text-primary hover:underline"
              href="/"
            >
              <MaterialIcon className="text-[18px]" name="arrow_back" />
              {t("goPortal")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
