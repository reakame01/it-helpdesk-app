"use client";

import { useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";

type SuccessModalProps = {
  open: boolean;
  ticketId: string;
  requesterLabel: string;
  categoryLabel: string;
  extension: string;
  onClose: () => void;
};

export function SuccessModal({
  open,
  ticketId,
  requesterLabel,
  categoryLabel,
  extension,
  onClose,
}: SuccessModalProps) {
  const t = useTranslations("modal");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 p-space-md backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col items-center rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-xl">
        <div className="mb-space-md flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-sm">
          <MaterialIcon className="text-[42px]" name="check_circle" />
        </div>
        <span className="mb-space-xs rounded-full bg-primary-fixed px-space-md py-1 font-label-md text-label-md font-bold text-primary">
          {t("successBadge")}
        </span>
        <h3 className="mt-space-2xs font-headline-lg text-headline-lg tracking-tight text-primary">
          {t("ticketNumber", { ticketId })}
        </h3>
        <p className="mt-space-xs font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {t("successBody", { extension })}
        </p>
        <div className="mt-space-md flex w-full flex-col gap-1 rounded-xl bg-surface-container-low p-space-md text-left font-body-sm text-body-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">{t("requester")}</span>
            <span className="font-bold text-on-surface">{requesterLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">{t("category")}</span>
            <span className="font-bold text-primary">{categoryLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">{t("status")}</span>
            <span className="flex items-center gap-1 font-bold text-secondary">
              <span className="h-2 w-2 animate-ping rounded-full bg-secondary" />{" "}
              {t("statusValue")}
            </span>
          </div>
        </div>
        <div className="mt-space-lg flex w-full flex-col gap-space-sm sm:flex-row">
          <button
            className="flex h-target-min flex-1 items-center justify-center gap-space-xs rounded-xl bg-primary font-label-md text-label-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            type="button"
            onClick={onClose}
          >
            <MaterialIcon className="text-[20px]" name="track_changes" />
            <span>{t("goTrack")}</span>
          </button>
          <button
            className="h-target-min rounded-xl bg-surface-container px-space-lg font-label-md text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            type="button"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
