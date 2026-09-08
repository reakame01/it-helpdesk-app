"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ItLoginForm } from "@/components/auth/it-login-form";
import { MaterialIcon } from "@/components/shared/material-icon";

type ItLoginDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ItLoginDialog({ open, onClose }: ItLoginDialogProps) {
  const t = useTranslations("login");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm"
      role="presentation"
    >
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          aria-labelledby="it-login-dialog-title"
          aria-modal="true"
          className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          <button
            aria-label={t("closeDialog")}
            className="absolute right-space-md top-space-md flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            type="button"
            onClick={onClose}
          >
            <MaterialIcon className="text-[22px]" name="close" />
          </button>

          <div className="mb-space-lg flex flex-col gap-space-2xs text-center">
            <div className="mx-auto mb-space-sm flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary shadow-sm">
              <MaterialIcon className="text-[32px]" name="lock" />
            </div>
            <h2
              className="font-headline-lg text-headline-lg tracking-tight text-primary"
              id="it-login-dialog-title"
            >
              {t("title")}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t("itOnlySubtitle")}
            </p>
          </div>

          <ItLoginForm idPrefix="it-login-dialog" onSuccess={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
