"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ReferenceItemDto } from "@helpdesk/types";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  quickLogIssuePresets,
  quickLogResolvePresets,
} from "@/lib/mock/kanban";
import { cn } from "@/lib/utils";

type QuickLogDialogProps = {
  open: boolean;
  departments: ReferenceItemDto[];
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: {
    departmentCode: string;
    issue: string;
    resolve: string;
    requesterName?: string;
  }) => Promise<void>;
};

export function QuickLogDialog({
  open,
  departments,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}: QuickLogDialogProps) {
  const t = useTranslations("kanban.quickLogDialog");
  const locale = useLocale();
  const [department, setDepartment] = useState("");
  const [issue, setIssue] = useState("");
  const [resolve, setResolve] = useState("");
  const [requester, setRequester] = useState("");

  useEffect(() => {
    if (!open) return;
    setIssue("");
    setResolve("");
    setRequester("");
    setDepartment((current) => {
      if (current && departments.some((row) => row.code === current)) {
        return current;
      }
      return departments[0]?.code ?? "";
    });
  }, [open, departments]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    await onSubmit({
      departmentCode: department,
      issue,
      resolve,
      requesterName: requester.trim() || undefined,
    });
  }

  function departmentLabel(item: ReferenceItemDto): string {
    return locale.startsWith("th") ? item.labelTh : item.labelEn;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 p-space-md backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border-l-4 border-l-secondary bg-surface-container-lowest shadow-2xl">
        <div className="flex items-start justify-between bg-primary p-space-lg text-on-primary">
          <div className="flex items-start gap-space-sm">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container/50 text-secondary-fixed">
              <MaterialIcon className="text-[26px]" name="bolt" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-space-xs">
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-primary">
                  {t("title")}
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-secondary-fixed px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
                  <MaterialIcon className="text-[15px]" name="check_circle" />
                  {t("badge")}
                </span>
              </div>
              <p className="font-body-sm text-body-sm leading-snug text-on-primary-container">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-primary transition-colors hover:bg-on-primary/10"
            disabled={busy}
            onClick={onClose}
          >
            <MaterialIcon className="text-[24px]" name="close" />
          </button>
        </div>

        <form
          className="flex flex-col gap-space-md overflow-y-auto p-space-xl"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center justify-between gap-2">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                {t("department")} <span className="text-error">*</span>
              </label>
              <span className="font-label-sm text-label-sm font-medium text-secondary">
                {t("departmentHint")}
              </span>
            </div>
            {departments.length === 0 ? (
              <p className="font-body-sm text-body-sm text-error">{t("noDepartments")}</p>
            ) : (
              <div className="flex flex-wrap gap-space-xs">
                {departments.map((dept) => (
                  <label key={dept.code} className="cursor-pointer">
                    <input
                      checked={department === dept.code}
                      className="peer hidden"
                      name="quick_dept"
                      type="radio"
                      onChange={() => setDepartment(dept.code)}
                    />
                    <span className="block rounded-lg bg-surface-container-low px-space-md py-1.5 font-label-sm text-label-sm text-on-surface shadow-sm transition-colors peer-checked:bg-primary peer-checked:font-semibold peer-checked:text-on-primary">
                      {departmentLabel(dept)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center justify-between gap-2">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                {t("issue")} <span className="text-error">*</span>
              </label>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t("issueHint")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {quickLogIssuePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-md bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-primary transition-colors hover:bg-surface-container-high"
                  onClick={() => setIssue(t(`presets.${preset}`))}
                >
                  {t(`presets.${preset}`)}
                </button>
              ))}
            </div>
            <input
              required
              className="h-12 rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder={t("issuePlaceholder")}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center justify-between gap-2">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                {t("resolve")} <span className="text-error">*</span>
              </label>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t("resolveHint")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {quickLogResolvePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-md bg-secondary-container/50 px-2.5 py-1 font-label-sm text-label-sm text-on-secondary-container transition-colors hover:bg-secondary-container"
                  onClick={() => setResolve(t(`presets.${preset}`))}
                >
                  {t(`presets.${preset}`)}
                </button>
              ))}
            </div>
            <input
              required
              className="h-12 rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder={t("resolvePlaceholder")}
              value={resolve}
              onChange={(e) => setResolve(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-md text-label-md font-semibold text-on-surface">
              {t("requesterOptional")}
            </label>
            <input
              className="h-12 rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder={t("requesterPlaceholder")}
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-error-container/40 px-3 py-2 font-body-sm text-body-sm text-error">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-space-sm pt-space-sm sm:flex-row sm:justify-end">
            <button
              type="button"
              className={cn(
                "h-11 rounded-lg bg-surface-container px-space-lg font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high",
              )}
              disabled={busy}
              onClick={onClose}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={busy || departments.length === 0}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-space-lg font-label-md text-label-md font-bold text-on-secondary shadow-md transition-colors hover:bg-on-secondary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MaterialIcon className="text-[20px]" name="bolt" />
              {busy ? t("saving") : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
