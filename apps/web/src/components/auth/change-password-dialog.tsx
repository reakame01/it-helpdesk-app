"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useItAuth } from "@/components/auth/it-auth-context";
import { MaterialIcon } from "@/components/shared/material-icon";

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ChangePasswordDialog({
  open,
  onClose,
  onSuccess,
}: ChangePasswordDialogProps) {
  const t = useTranslations("profile");
  const { changePassword } = useItAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorKey, setErrorKey] = useState<
    "wrongCurrent" | "mismatch" | "tooShort" | "requestFailed" | null
  >(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorKey(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void (async () => {
      const result = await changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );
      if (!result.ok) {
        setErrorKey(result.error);
        return;
      }
      setErrorKey(null);
      onSuccess?.();
      onClose();
    })();
  }

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
          aria-labelledby="change-password-dialog-title"
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

          <div className="mb-space-lg flex flex-col gap-space-2xs pr-10">
            <div className="mb-space-sm flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-primary">
              <MaterialIcon className="text-[26px]" name="vpn_key" />
            </div>
            <h2
              className="font-headline-sm text-headline-sm font-semibold text-primary"
              id="change-password-dialog-title"
            >
              {t("changePasswordDialogTitle")}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("changePasswordDialogSubtitle")}
            </p>
          </div>

          <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
            <PasswordField
              id="change-pwd-current"
              label={t("currentPassword")}
              show={showCurrent}
              value={currentPassword}
              onChange={setCurrentPassword}
              onToggle={() => setShowCurrent((v) => !v)}
              hideLabel={t("hidePassword")}
              showLabel={t("showPassword")}
            />
            <PasswordField
              id="change-pwd-new"
              label={t("newPassword")}
              hint={t("newPasswordHint")}
              show={showNew}
              value={newPassword}
              onChange={setNewPassword}
              onToggle={() => setShowNew((v) => !v)}
              hideLabel={t("hidePassword")}
              showLabel={t("showPassword")}
            />
            <PasswordField
              id="change-pwd-confirm"
              label={t("confirmNewPassword")}
              show={showConfirm}
              value={confirmPassword}
              onChange={setConfirmPassword}
              onToggle={() => setShowConfirm((v) => !v)}
              hideLabel={t("hidePassword")}
              showLabel={t("showPassword")}
            />

            {errorKey ? (
              <p className="font-body-sm text-body-sm text-error">
                {t(`changePasswordErrors.${errorKey}`)}
              </p>
            ) : null}

            <div className="mt-space-xs flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
              <button
                className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
                type="button"
                onClick={onClose}
              >
                {t("cancel")}
              </button>
              <button
                className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container"
                type="submit"
              >
                <MaterialIcon className="text-[18px]" name="check_circle" />
                {t("changePasswordSubmit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  showLabel,
  hideLabel,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-space-2xs">
      <label className="font-label-md text-label-md text-on-surface" htmlFor={id}>
        {label} <span className="text-error">*</span>
      </label>
      <div className="relative">
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-lg bg-surface-container-low px-space-md pr-11 font-body-md text-body-md text-on-surface outline-none ring-2 ring-transparent transition-colors focus:bg-surface-container-lowest focus:ring-primary"
          id={id}
          required
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          aria-label={show ? hideLabel : showLabel}
          className="absolute right-3 top-3 text-outline hover:text-on-surface"
          type="button"
          onClick={onToggle}
        >
          <MaterialIcon
            className="text-[22px]"
            name={show ? "visibility_off" : "visibility"}
          />
        </button>
      </div>
      {hint ? (
        <span className="text-[12px] font-body-sm text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
