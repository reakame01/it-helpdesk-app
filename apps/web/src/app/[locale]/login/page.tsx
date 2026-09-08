"use client";

import { useTranslations } from "next-intl";
import { ItLoginForm } from "@/components/auth/it-login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MaterialIcon } from "@/components/shared/material-icon";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-gutter-desktop py-space-xl">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-surface-container-lowest p-space-xl shadow-sm">
          <div className="mb-space-lg flex items-center justify-between gap-space-md">
            <BrandLogo />
            <LanguageSwitcher variant="full" />
          </div>

          <div className="mb-space-lg flex flex-col gap-space-2xs text-center">
            <div className="mx-auto mb-space-sm flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary shadow-sm">
              <MaterialIcon className="text-[32px]" name="lock" />
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
              {t("title")}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t("itOnlySubtitle")}
            </p>
          </div>

          <ItLoginForm
            idPrefix="login-page"
            onSuccess={() => router.push("/")}
          />
        </div>

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
    </div>
  );
}
