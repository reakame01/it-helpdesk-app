"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";
import { useItAuth } from "@/components/auth/it-auth-context";

type ItLoginFormProps = {
  onSuccess?: () => void;
  idPrefix?: string;
};

export function ItLoginForm({
  onSuccess,
  idPrefix = "login",
}: ItLoginFormProps) {
  const t = useTranslations("login");
  const { login } = useItAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = login(email, password);
    if (!ok) {
      setError(true);
      return;
    }
    setError(false);
    onSuccess?.();
  }

  return (
    <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-space-2xs">
        <label
          className="font-label-md text-label-md text-on-surface"
          htmlFor={`${idPrefix}-email`}
        >
          {t("email")}
        </label>
        <input
          autoComplete="username"
          className="h-target-min w-full rounded-xl bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface outline-none ring-2 ring-transparent transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:ring-secondary"
          id={`${idPrefix}-email`}
          placeholder={t("emailPlaceholder")}
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-space-2xs">
        <label
          className="font-label-md text-label-md text-on-surface"
          htmlFor={`${idPrefix}-password`}
        >
          {t("password")}
        </label>
        <input
          autoComplete="current-password"
          className="h-target-min w-full rounded-xl bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface outline-none ring-2 ring-transparent transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:ring-secondary"
          id={`${idPrefix}-password`}
          placeholder={t("passwordPlaceholder")}
          required
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

      {error ? (
        <p className="text-center font-body-sm text-body-sm text-error">
          {t("invalidCredentials")}
        </p>
      ) : null}

      <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
        {t("mockHint")}
      </p>
    </form>
  );
}
