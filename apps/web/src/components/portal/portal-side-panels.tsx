"use client";

import { useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";

export { ItStaffPanel } from "./it-staff-panel";

export function SelfHelpPanel() {
  const t = useTranslations("portal.tips");
  const tips = [
    { title: t("tip1Title"), body: t("tip1Body") },
    { title: t("tip2Title"), body: t("tip2Body") },
    { title: t("tip3Title"), body: t("tip3Body") },
  ];

  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center gap-space-xs">
        <MaterialIcon className="text-[24px] text-primary" name="lightbulb" />
        <h3 className="font-headline-sm text-headline-sm text-primary">
          {t("title")}
        </h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("intro")}
      </p>
      <div className="flex flex-col gap-space-sm">
        {tips.map((tip, index) => (
          <div
            key={tip.title}
            className="rounded-lg bg-surface-container-low p-space-md shadow-sm transition-colors hover:bg-surface-container"
          >
            <div className="mb-1 flex items-center gap-space-xs font-label-md text-label-md font-bold text-on-surface">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-sm font-bold text-primary">
                {index + 1}
              </span>
              <span>{tip.title}</span>
            </div>
            <p className="pl-8 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              {tip.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueueStatsPanel() {
  const t = useTranslations("portal.queue");

  return (
    <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-label-md text-label-md font-bold text-on-surface">
          {t("title")}
        </span>
        <MaterialIcon className="text-[20px] text-secondary" name="speed" />
      </div>
      <div className="my-space-xs flex items-center gap-space-md">
        <div className="relative h-24 w-24 shrink-0">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
            <path
              className="text-surface-container-highest"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.8"
            />
            <path
              className="text-secondary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray="72, 100"
              strokeLinecap="round"
              strokeWidth="3.8"
            />
            <path
              className="text-primary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray="20, 100"
              strokeDashoffset="-72"
              strokeLinecap="round"
              strokeWidth="3.8"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-headline-sm text-headline-sm font-bold leading-none text-primary">
              {t("centerValue")}
            </span>
            <span className="font-label-sm text-[10px] text-label-sm text-on-surface-variant">
              {t("centerLabel")}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
              {t("doneLabel")}
            </span>
            <span className="font-bold text-on-surface">{t("doneCount")}</span>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              {t("inProgressLabel")}
            </span>
            <span className="font-bold text-on-surface">
              {t("inProgressCount")}
            </span>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-tertiary-fixed-dim" />
              {t("waitingLabel")}
            </span>
            <span className="font-bold text-on-surface">{t("waitingCount")}</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-surface-container-lowest p-space-sm text-center font-body-sm text-body-sm font-semibold text-secondary shadow-sm">
        {t("avgSpeed")}
      </div>
    </div>
  );
}
