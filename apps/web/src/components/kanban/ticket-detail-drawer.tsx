"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  getTicketDetail,
  kanbanAssignees,
  type KanbanTicket,
  type TimelineTone,
} from "@/lib/mock/kanban";
import { cn } from "@/lib/utils";

type TicketDetailDrawerProps = {
  ticket: KanbanTicket | null;
  open: boolean;
  onClose: () => void;
  onResolve: () => void;
};

const toneClass: Record<TimelineTone, string> = {
  neutral: "bg-surface-container-high text-primary",
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary text-on-secondary",
  tertiary: "bg-tertiary text-on-tertiary",
  error: "bg-error text-on-error",
  success: "bg-primary-container text-on-primary-container",
};

export function TicketDetailDrawer({
  ticket,
  open,
  onClose,
  onResolve,
}: TicketDetailDrawerProps) {
  const t = useTranslations("kanban");
  const [entered, setEntered] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !ticket) {
      setEntered(false);
      return;
    }
    setNote("");
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [open, ticket]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!ticket) return null;

  const detail = getTicketDetail(ticket);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end transition-opacity duration-300",
        entered
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
      aria-hidden={!entered}
    >
      <button
        type="button"
        className="absolute inset-0 bg-on-background/40 backdrop-blur-sm"
        aria-label={t("detail.close")}
        onClick={onClose}
      />

      <aside
        className={cn(
          "relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-surface-container-lowest shadow-2xl transition-transform duration-300 pointer-events-auto",
          entered ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-detail-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface-container-lowest/95 px-space-lg py-space-md shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-md text-label-md font-bold text-on-tertiary-fixed">
              #{ticket.id}
            </span>
            {detail.reopenedCount ? (
              <span className="rounded-full bg-error-container px-2 py-0.5 font-label-md text-[11px] font-bold text-error">
                {t("detail.reopened", { count: detail.reopenedCount })}
              </span>
            ) : null}
            <span className="rounded-full bg-secondary-fixed px-2 py-0.5 font-label-md text-[11px] font-semibold text-on-secondary-fixed">
              {t(ticket.categoryKey)}
            </span>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
            onClick={onClose}
          >
            <MaterialIcon className="text-[20px]" name="close" />
          </button>
        </div>

        <div className="flex flex-col gap-space-md p-space-lg">
          <div>
            <h2
              id="ticket-detail-title"
              className="font-headline-md text-headline-md font-bold leading-snug text-on-surface"
            >
              {t(ticket.titleKey)}
            </h2>
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs font-label-md text-label-md text-on-surface-variant">
              <span className="flex items-center gap-1 text-on-surface">
                <MaterialIcon className="text-[16px] text-primary" name="account_circle" />
                {t("detail.openedBy")}{" "}
                <strong>{t(detail.requesterKey)}</strong>
              </span>
              <span>•</span>
              <span>
                {t("detail.extension")}: {detail.extension}
              </span>
              <span>•</span>
              <span className="font-semibold text-tertiary">
                {t("detail.currentStatus")}: {t(detail.statusKey)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-space-sm">
            <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
              {t("detail.descriptionLabel")}
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              {t(detail.descriptionKey)}
            </p>
          </div>

          <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-title-md text-title-md font-bold text-on-surface">
                <MaterialIcon className="text-[20px] text-primary" name="handshake" />
                {t("detail.teamTitle")}
              </span>
              <button
                type="button"
                className="flex items-center gap-1 font-label-md text-label-md font-semibold text-primary hover:underline"
              >
                <MaterialIcon className="text-[16px]" name="person_add" />
                {t("detail.addCollaborator")}
              </button>
            </div>

            {detail.collaborators.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("unassigned")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-space-xs pt-1 sm:grid-cols-2">
                {detail.collaborators.map((collab) => {
                  const person = kanbanAssignees.find((a) => a.id === collab.assigneeId);
                  if (!person) return null;
                  return (
                    <div
                      key={`${collab.assigneeId}-${collab.role}`}
                      className="flex items-center justify-between rounded-lg bg-surface-container-low p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                            person.colorClass,
                          )}
                        >
                          {person.initial}
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-bold text-on-surface">
                            {t(person.nameKey)}{" "}
                            <span className="font-normal text-on-surface-variant">
                              ({t(`detail.role.${collab.role}`)})
                            </span>
                          </div>
                          <div className="font-label-md text-[11px] text-on-surface-variant">
                            {t(person.specialtyKey)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold",
                          collab.role === "lead"
                            ? "bg-secondary-fixed text-on-secondary-fixed"
                            : "bg-surface-container text-on-surface-variant",
                        )}
                      >
                        {t(`detail.roleBadge.${collab.role}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-space-xs pt-space-xs">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
                <MaterialIcon className="text-[20px] text-primary" name="history" />
                {t("detail.timelineTitle")}
              </h3>
              <span className="font-label-md text-label-md text-outline">
                {t("detail.timelineCount", { count: detail.timeline.length })}
              </span>
            </div>

            <div className="relative space-y-6 py-space-sm pl-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-0.5 before:bg-outline-variant/40 before:content-['']">
              {detail.timeline.map((item, index) => (
                <div key={item.titleKey} className="relative">
                  <div
                    className={cn(
                      "absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                      toneClass[item.tone],
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-label-md text-label-md font-bold",
                          item.tone === "error" ? "text-error" : "text-on-surface",
                          item.tone === "primary" && "text-primary",
                        )}
                      >
                        {t(item.timeKey)}
                      </span>
                      <span
                        className={cn(
                          "font-label-md text-label-md",
                          item.tone === "error" && "font-bold text-error",
                          item.tone === "primary" && "font-bold text-primary",
                          item.tone === "secondary" && "font-bold text-secondary",
                          item.tone === "tertiary" && "font-bold text-tertiary",
                          item.tone === "neutral" && "text-on-surface-variant",
                          item.tone === "success" && "font-bold text-on-surface",
                        )}
                      >
                        {t(item.titleKey)}
                      </span>
                    </div>
                    {item.bodyKey ? (
                      <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                        {t(item.bodyKey)}
                      </p>
                    ) : null}
                    {item.noteKey ? (
                      <div
                        className={cn(
                          "mt-1 rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface",
                          item.noteTone === "error"
                            ? "bg-error-container/40"
                            : "bg-surface-container-low",
                        )}
                      >
                        {t(item.noteKey)}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-space-sm flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-sm">
            <label className="flex items-center gap-1.5 font-label-md text-label-md font-bold text-on-surface">
              <MaterialIcon className="text-[18px] text-primary" name="edit_note" />
              {t("detail.noteLabel")}
            </label>
            <textarea
              className="w-full rounded-lg bg-surface-container-lowest p-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("detail.notePlaceholder")}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1 font-label-md text-[12px] text-on-surface-variant hover:text-on-surface"
                >
                  <MaterialIcon className="text-[16px]" name="attachment" />
                  {t("detail.attachLog")}
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 font-label-md text-[12px] text-on-surface-variant hover:text-on-surface"
                >
                  <MaterialIcon className="text-[16px]" name="terminal" />
                  {t("detail.attachCommit")}
                </button>
              </div>
              <button
                type="button"
                className="rounded-lg bg-primary px-3.5 py-1.5 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
              >
                {t("detail.sendNote")}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-space-xs pt-space-md">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container-high"
              >
                <MaterialIcon className="text-[18px]" name="forward" />
                {t("detail.transfer")}
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container-high"
              >
                <MaterialIcon className="text-[18px]" name="group_add" />
                {t("detail.addCollaboratorShort")}
              </button>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md font-bold text-on-primary shadow-md hover:bg-primary-container"
              onClick={onResolve}
            >
              <MaterialIcon className="text-[18px]" name="check_circle" />
              {t("detail.resolve")}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
