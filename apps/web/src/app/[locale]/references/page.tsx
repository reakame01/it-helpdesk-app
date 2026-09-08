"use client";

import { useTranslations } from "next-intl";
import { PortalFooter } from "@/components/portal/portal-footer";
import { PortalHeader } from "@/components/portal/portal-header";

export default function DataReferencesPage() {
  const t = useTranslations("dataReferences");

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PortalHeader activeNav="dataReferences" />
      <main className="w-full flex-1 pt-[8.5rem]">
        <section className="mx-auto w-full max-w-container-max px-gutter-desktop py-space-xl">
          <h1 className="font-headline-md text-headline-md text-on-surface">
            {t("title")}
          </h1>
          <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
            {t("subtitle")}
          </p>
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
