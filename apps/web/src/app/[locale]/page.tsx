"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PortalFooter } from "@/components/portal/portal-footer";
import { PortalHeader } from "@/components/portal/portal-header";
import {
  ItStaffPanel,
  QueueStatsPanel,
  SelfHelpPanel,
} from "@/components/portal/portal-side-panels";
import { SubmitTicketForm } from "@/components/portal/submit-ticket-form";
import { SuccessModal } from "@/components/portal/success-modal";
import { MaterialIcon } from "@/components/shared/material-icon";

type SuccessState = {
  ticketId: string;
  requesterLabel: string;
  categoryLabel: string;
  extension: string;
};

export default function PortalPage() {
  const t = useTranslations("portal");
  const [success, setSuccess] = useState<SuccessState | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PortalHeader activeNav="userPortal" />

      <main className="w-full flex-1 pt-[8.5rem]">
        <section className="mx-auto w-full max-w-container-max px-gutter-desktop py-space-xl">
          <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
            <div className="flex flex-col">
              <div className="mb-space-xs inline-flex w-fit items-center gap-space-xs rounded-full bg-secondary-container px-space-md py-1 font-label-sm text-label-sm text-on-secondary-container shadow-sm">
                <MaterialIcon className="text-[18px]" name="verified_user" />
                <span>{t("badge")}</span>
              </div>
              <h1 className="font-display text-display tracking-tight text-primary">
                {t("title")}
              </h1>
              <p className="mt-space-2xs font-body-lg text-body-lg text-on-surface-variant">
                {t("subtitle")}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-space-md rounded-xl bg-error-container/40 p-space-md shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error text-on-error shadow-md">
                <MaterialIcon className="text-[26px]" name="call" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-bold text-error">
                  {t("hotlineTitle")}
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {t("hotlineNumbers")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
            <div className="lg:col-span-8">
              <SubmitTicketForm
                onSuccess={(payload) => setSuccess(payload)}
              />
            </div>
            <aside className="flex flex-col gap-space-lg lg:col-span-4">
              <ItStaffPanel />
              <SelfHelpPanel />
              <QueueStatsPanel />
            </aside>
          </div>
        </section>
      </main>

      <PortalFooter />

      <SuccessModal
        categoryLabel={success?.categoryLabel ?? ""}
        extension={success?.extension ?? ""}
        open={Boolean(success)}
        requesterLabel={success?.requesterLabel ?? ""}
        ticketId={success?.ticketId ?? ""}
        onClose={() => setSuccess(null)}
      />
    </div>
  );
}
