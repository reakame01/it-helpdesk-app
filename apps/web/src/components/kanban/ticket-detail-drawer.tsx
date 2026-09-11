"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import type { BoardTicketDto, ConfirmTokenPeekDto, OnDutyStaffDto, WorklogDto } from "@helpdesk/types";
import { MaterialIcon } from "@/components/shared/material-icon";
import { SafeAvatar } from "@/components/shared/safe-avatar";
import {
  addTicketCollaborator,
  approveAndClose,
  approveAndCloseWithToken,
  fetchOnDutyStaff,
  fetchTicketWorklogs,
  getApiErrorMessage,
  reopenTicket,
  reopenTicketWithToken,
  reportIssueWithToken,
  resendConfirm,
  resolveMediaUrl,
  removeTicketCollaborator,
  sendForUserTest,
  updateTicketProgress,
  editTicketProgressWorklog,
  deleteTicketProgressWorklog,
  hardDeleteTicket,
} from "@/lib/api";
import {
  assigneeInitial,
  assigneeSwatch,
  categoryFilterKey,
  formatTicketAge,
  isDevelopmentTicket,
  isQuickTicket,
  parseProgressWorklog,
  showsDevelopmentProgress,
} from "@/lib/kanban/board-view";
import { staffDisplayName } from "@/lib/hooks/use-on-duty-staff";
import { cn } from "@/lib/utils";

type TicketDetailDrawerProps = {
  ticket: BoardTicketDto | null;
  departmentLabel: string;
  open: boolean;
  currentUserId: string | null;
  confirmToken: string | null;
  tokenPeek: ConfirmTokenPeekDto | null;
  onClose: () => void;
  onTicketUpdated: (ticket: BoardTicketDto) => void;
  onTicketDeleted: (ticketId: string) => void;
  onToast: (message: string) => void;
  onRequestClaim: () => void;
  onRequestWithdraw: () => void;
};

export function TicketDetailDrawer({
  ticket,
  departmentLabel,
  open,
  currentUserId,
  confirmToken,
  tokenPeek,
  onClose,
  onTicketUpdated,
  onTicketDeleted,
  onToast,
  onRequestClaim,
  onRequestWithdraw,
}: TicketDetailDrawerProps) {
  const t = useTranslations("kanban");
  const locale = useLocale();
  const [entered, setEntered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<File[]>([]);
  const [worklogs, setWorklogs] = useState<WorklogDto[]>([]);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [editingWorklogId, setEditingWorklogId] = useState<string | null>(null);
  const [editPercent, setEditPercent] = useState(0);
  const [editNote, setEditNote] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    percent: number;
    summary: string;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState(false);
  const [staffOptions, setStaffOptions] = useState<OnDutyStaffDto[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    if (!open || !ticket) {
      setEntered(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [open, ticket]);

  useEffect(() => {
    if (!ticket) return;
    setProgressPercent(ticket.progress ?? 0);
    setProgressNote("");
    setReason("");
    setEvidence([]);
    setUpdatesOpen(false);
    setEditingWorklogId(null);
    setEditNote("");
    setPendingDelete(null);
    setPickerOpen(false);
    setPendingRemove(null);
    setPendingHardDelete(false);
  }, [ticket?.id]);

  useEffect(() => {
    if (!open || !ticket || !isDevelopmentTicket(ticket)) {
      setWorklogs([]);
      return;
    }
    let cancelled = false;
    void fetchTicketWorklogs(ticket.id)
      .then((rows) => {
        if (!cancelled) setWorklogs(rows);
      })
      .catch(() => {
        if (!cancelled) setWorklogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ticket?.id, ticket?.updatedAt]);

  useEffect(() => {
    if (!pickerOpen) {
      setStaffOptions([]);
      setStaffLoading(false);
      return;
    }
    let cancelled = false;
    setStaffLoading(true);
    void fetchOnDutyStaff()
      .then((rows) => {
        if (!cancelled) setStaffOptions(rows);
      })
      .catch(() => {
        if (!cancelled) setStaffOptions([]);
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (pendingRemove) {
        if (!busy) setPendingRemove(null);
        return;
      }
      if (pendingHardDelete) {
        if (!busy) setPendingHardDelete(false);
        return;
      }
      if (pickerOpen) {
        if (!busy) setPickerOpen(false);
        return;
      }
      if (pendingDelete) {
        if (!busy) setPendingDelete(null);
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pendingDelete, pendingRemove, pendingHardDelete, pickerOpen, busy]);

  if (!ticket) return null;

  const team = [
    ...(ticket.lead ? [ticket.lead] : []),
    ...ticket.collaborators,
  ];
  const categoryKey = categoryFilterKey(ticket.categoryCode);
  const statusKey = `detail.status.${ticket.column}`;
  const isLead = Boolean(currentUserId && ticket.lead?.userId === currentUserId);
  const isAssignee = Boolean(
    currentUserId &&
      [ticket.lead?.userId, ...ticket.collaborators.map((row) => row.userId)].includes(
        currentUserId,
      ),
  );
  const tokenForThisTicket =
    confirmToken && tokenPeek && tokenPeek.ticketId === ticket.id
      ? tokenPeek
      : null;
  const canApprove =
    (isAssignee || tokenForThisTicket?.allowedActions.includes("approve-and-close")) &&
    ticket.status === "AWAITING_USER_TEST";
  const canReportIssue =
    Boolean(tokenForThisTicket?.allowedActions.includes("report-issue")) &&
    ticket.status === "AWAITING_USER_TEST";
  const canReopen =
    (isAssignee || tokenForThisTicket?.allowedActions.includes("reopen")) &&
    ticket.status === "RESOLVED";
  const canSend = isAssignee && ticket.status === "IN_PROGRESS";
  const canResend =
    isAssignee &&
    (ticket.status === "AWAITING_USER_TEST" || ticket.status === "RESOLVED");
  const canEditProgress = isAssignee && showsDevelopmentProgress(ticket);
  const canWithdraw = isAssignee && ticket.status === "IN_PROGRESS";
  const canClaim = Boolean(currentUserId) && ticket.column === "backlog";
  const showClaim = ticket.column === "backlog";
  const hasWriteSurface =
    canApprove || canReportIssue || canReopen || canSend || canResend;

  async function runAction(work: () => Promise<BoardTicketDto>, successKey: string) {
    setBusy(true);
    try {
      const updated = await work();
      onTicketUpdated(updated);
      onToast(t(successKey));
      setReason("");
      setEvidence([]);
      if (
        successKey === "progressSaved" ||
        successKey === "progressEdited" ||
        successKey === "progressDeleted"
      ) {
        setUpdatesOpen(true);
        setEditingWorklogId(null);
        setPendingDelete(null);
      }
      if (
        successKey === "detail.collaboratorAdded" ||
        successKey === "detail.collaboratorRemoved"
      ) {
        setPickerOpen(false);
        setPendingRemove(null);
      }
    } catch (err) {
      onToast(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

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
              {ticket.ticketNo}
            </span>
            {isQuickTicket(ticket) ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-container px-2 py-0.5 font-label-md text-[11px] font-semibold text-on-secondary-container">
                <MaterialIcon className="text-[14px]" name="bolt" />
                {t("quickLogBadge")}
              </span>
            ) : null}
            <span className="rounded-full bg-secondary-fixed px-2 py-0.5 font-label-md text-[11px] font-semibold text-on-secondary-fixed">
              {t(`categories.${categoryKey}`)}
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
              {ticket.title}
            </h2>
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs font-label-md text-label-md text-on-surface-variant">
              <span className="flex items-center gap-1 text-on-surface">
                <MaterialIcon className="text-[16px] text-primary" name="account_circle" />
                {t("detail.openedBy")}{" "}
                <strong>
                  {ticket.requesterName === "Walk-up"
                    ? t("quickLogUnnamed")
                    : ticket.requesterName}
                </strong>
              </span>
              {ticket.requesterEmail ? (
                <>
                  <span>•</span>
                  <span>{ticket.requesterEmail}</span>
                </>
              ) : null}
              {ticket.extension && ticket.extension !== "-" ? (
                <>
                  <span>•</span>
                  <span>
                    {t("detail.extension")}: {ticket.extension}
                  </span>
                </>
              ) : null}
              <span>•</span>
              <span className="font-semibold text-tertiary">
                {t("detail.currentStatus")}: {t(statusKey)}
              </span>
            </div>
            <p className="pt-1 font-body-sm text-body-sm text-on-surface-variant">
              {departmentLabel}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-space-sm">
            <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
              {t("detail.descriptionLabel")}
            </span>
            <p className="whitespace-pre-wrap font-body-md text-body-md text-on-surface">
              {ticket.description}
            </p>
          </div>

          {ticket.attachments.length > 0 ? (
            <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-sm">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {t("detail.attachments")}
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ticket.attachments.map((file) => {
                  const src = resolveMediaUrl(file.publicPath);
                  return (
                    <a
                      key={file.id}
                      href={src ?? file.publicPath}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-lg bg-surface-container-lowest"
                    >
                      {file.contentType.startsWith("image/") && src ? (
                        <img
                          src={src}
                          alt={file.originalName ?? ticket.ticketNo}
                          className="h-28 w-full object-cover"
                        />
                      ) : (
                        <span className="block p-2 font-label-sm text-label-sm">
                          {file.originalName ?? file.publicPath}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-title-md text-title-md font-bold text-on-surface">
                <MaterialIcon className="text-[20px] text-primary" name="handshake" />
                {t("detail.teamTitle")}
              </span>
              {isLead ? (
                <button
                  type="button"
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg bg-secondary-container px-2.5 py-1.5 font-label-md text-label-md font-semibold text-on-secondary-container disabled:opacity-50"
                  onClick={() => setPickerOpen(true)}
                >
                  <MaterialIcon className="text-[18px]" name="person_add" />
                  {t("detail.addCollaboratorShort")}
                </button>
              ) : null}
            </div>

            {team.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("unassigned")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-space-xs pt-1 sm:grid-cols-2">
                {team.map((person) => {
                  const role = person.role === "LEAD" ? "lead" : "collaborator";
                  return (
                    <div
                      key={`${person.userId}-${person.role}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                            assigneeSwatch(person.userId),
                          )}
                        >
                          {assigneeInitial(person.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-label-lg text-label-lg font-bold text-on-surface">
                            {person.name}{" "}
                            <span className="font-normal text-on-surface-variant">
                              ({t(`detail.role.${role}`)})
                            </span>
                          </div>
                          <div className="font-label-md text-[11px] text-on-surface-variant">
                            {person.jobTitle || person.email}
                          </div>
                        </div>
                      </div>
                      {isLead && role === "collaborator" ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="shrink-0 rounded-md p-1 text-on-surface-variant hover:bg-error-container/50 hover:text-error disabled:opacity-50"
                          aria-label={t("detail.removeCollaborator")}
                          onClick={() =>
                            setPendingRemove({
                              userId: person.userId,
                              name: person.name,
                            })
                          }
                        >
                          <MaterialIcon className="text-[18px]" name="person_remove" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showClaim ? (
            <div className="flex flex-col gap-space-sm rounded-xl bg-secondary-container/40 p-space-md shadow-sm">
              <p className="font-body-sm text-body-sm text-on-secondary-container">
                {t("claimConfirmBody")}
              </p>
              <button
                type="button"
                disabled={!canClaim || busy}
                className="flex h-12 w-full items-center justify-center gap-space-xs rounded-xl bg-secondary font-label-lg text-label-lg font-bold text-on-secondary shadow-md transition-transform hover:bg-on-secondary-container hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onRequestClaim}
              >
                <MaterialIcon className="text-[22px]" name="handshake" />
                {canClaim ? t("claim") : t("claimGuestDisabled")}
              </button>
            </div>
          ) : null}

          {isDevelopmentTicket(ticket) ? (
            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-2 rounded-lg text-left transition-colors hover:bg-surface-container/80"
                aria-expanded={updatesOpen}
                aria-label={
                  updatesOpen
                    ? t("progressUpdatesCollapse")
                    : t("progressUpdatesExpand")
                }
                onClick={() => setUpdatesOpen((open) => !open)}
              >
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 font-title-md text-title-md font-bold text-on-surface">
                    <MaterialIcon className="text-[20px] text-secondary" name="timeline" />
                    {t("progressUpdates")}
                    <MaterialIcon
                      className="text-[20px] text-on-surface-variant"
                      name={updatesOpen ? "expand_less" : "expand_more"}
                    />
                  </span>
                  <p className="line-clamp-1 pt-1 font-body-sm text-body-sm text-on-surface-variant">
                    {updatesOpen
                      ? t("progressUpdatesHint")
                      : t("progressUpdatesCount", { count: worklogs.length })}
                    {!updatesOpen && worklogs[0] ? (
                      <>
                        {" · "}
                        {t("progressUpdatesLatest", {
                          summary: parseProgressWorklog(worklogs[0].note).summary,
                        })}
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary-container px-2.5 py-1 font-label-md text-label-md font-bold text-on-secondary-container">
                  {t("progressNow", { percent: ticket.progress ?? 0 })}
                </span>
              </button>

              <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-secondary transition-[width]"
                  style={{
                    width: `${Math.min(100, Math.max(0, ticket.progress ?? 0))}%`,
                  }}
                />
              </div>

              {updatesOpen ? (
                worklogs.length === 0 ? (
                  <p className="rounded-lg bg-surface-container-lowest px-3 py-3 font-body-sm text-body-sm text-on-surface-variant">
                    {t("progressUpdatesEmpty")}
                  </p>
                ) : (
                  <ol className="flex flex-col">
                    {worklogs.map((entry, index) => {
                      const parsed = parseProgressWorklog(entry.note);
                      const authorName = entry.author?.name ?? entry.authorId;
                      const canMutateEntry =
                        canEditProgress && parsed.percent != null;
                      const isEditing = editingWorklogId === entry.id;
                      return (
                        <li key={entry.id} className="flex gap-3">
                          <div className="flex w-10 shrink-0 flex-col items-center">
                            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-secondary-fixed px-1 font-label-sm text-[11px] font-bold text-on-secondary-fixed">
                              {parsed.percent == null
                                ? assigneeInitial(authorName)
                                : `${parsed.percent}`}
                            </span>
                            {index < worklogs.length - 1 ? (
                              <span className="mt-1 w-px flex-1 bg-outline-variant/60" />
                            ) : null}
                          </div>
                          <div className="mb-space-sm min-w-0 flex-1 rounded-lg bg-surface-container-lowest p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                                {authorName}
                              </span>
                              <span className="font-label-md text-[11px] text-on-surface-variant">
                                {formatTicketAge(entry.createdAt, locale)}
                              </span>
                            </div>
                            {isEditing ? (
                              <form
                                className="flex flex-col gap-2 pt-2"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  void runAction(
                                    () =>
                                      editTicketProgressWorklog(ticket.id, entry.id, {
                                        percent: editPercent,
                                        note: editNote,
                                      }),
                                    "progressEdited",
                                  );
                                }}
                              >
                                <label className="font-label-md text-label-md font-semibold text-on-surface">
                                  {t("progress")}: {editPercent}%
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={editPercent}
                                  disabled={busy}
                                  onChange={(event) =>
                                    setEditPercent(Number(event.target.value))
                                  }
                                />
                                <textarea
                                  className="min-h-20 rounded-lg bg-surface-container-low p-2 font-body-sm text-body-sm text-on-surface"
                                  value={editNote}
                                  disabled={busy}
                                  onChange={(event) => setEditNote(event.target.value)}
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="submit"
                                    disabled={busy || !editNote.trim()}
                                    className="rounded-lg bg-primary px-3 py-2 font-label-md text-label-md font-semibold text-on-primary disabled:opacity-50"
                                  >
                                    {busy ? t("actionBusy") : t("progressEditSave")}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    className="rounded-lg bg-surface-container-high px-3 py-2 font-label-md text-label-md font-semibold text-on-surface disabled:opacity-50"
                                    onClick={() => setEditingWorklogId(null)}
                                  >
                                    {t("progressEditCancel")}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                {parsed.percent != null ? (
                                  <p className="pt-0.5 font-label-md text-label-md font-semibold text-secondary">
                                    {t("progressReached", { percent: parsed.percent })}
                                  </p>
                                ) : null}
                                <p className="whitespace-pre-wrap pt-1 font-body-md text-body-md text-on-surface">
                                  {parsed.summary || entry.note}
                                </p>
                                {canMutateEntry ? (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-label-md text-label-md font-semibold text-primary disabled:opacity-50"
                                      onClick={() => {
                                        setEditingWorklogId(entry.id);
                                        setEditPercent(parsed.percent ?? 0);
                                        setEditNote(parsed.summary);
                                      }}
                                    >
                                      <MaterialIcon className="text-[16px]" name="edit" />
                                      {t("progressEdit")}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-label-md text-label-md font-semibold text-error disabled:opacity-50"
                                      onClick={() =>
                                        setPendingDelete({
                                          id: entry.id,
                                          percent: parsed.percent ?? 0,
                                          summary: parsed.summary || entry.note,
                                        })
                                      }
                                    >
                                      <MaterialIcon className="text-[16px]" name="delete" />
                                      {t("progressDelete")}
                                    </button>
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )
              ) : null}

              {canEditProgress ? (
                <form
                  className="flex flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void runAction(
                      () =>
                        updateTicketProgress(ticket.id, {
                          percent: progressPercent,
                          note: progressNote,
                        }),
                      "progressSaved",
                    );
                  }}
                >
                  <label className="font-label-md text-label-md font-semibold text-on-surface">
                    {t("progress")}: {progressPercent}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={progressPercent}
                    disabled={busy}
                    onChange={(event) =>
                      setProgressPercent(Number(event.target.value))
                    }
                  />
                  <textarea
                    className="min-h-20 rounded-lg bg-surface-container-low p-2 font-body-sm text-body-sm text-on-surface"
                    placeholder={t("progressNote")}
                    value={progressNote}
                    disabled={busy}
                    onChange={(event) => setProgressNote(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={busy || !progressNote.trim()}
                    className="rounded-lg bg-primary px-3 py-2 font-label-md text-label-md font-semibold text-on-primary disabled:opacity-50"
                  >
                    {busy ? t("actionBusy") : t("progressSave")}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}

          {hasWriteSurface ? (
            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
              {tokenForThisTicket ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t("tokenActionsHint")}
                </p>
              ) : null}

              {canSend ? (
                <button
                  type="button"
                  disabled={busy}
                  className="flex h-11 items-center justify-center gap-1 rounded-lg bg-secondary font-label-md text-label-md font-semibold text-on-secondary disabled:opacity-50"
                  onClick={() =>
                    void runAction(
                      () => sendForUserTest(ticket.id),
                      "sendForUserTestSuccess",
                    )
                  }
                >
                  <MaterialIcon className="text-[18px]" name="send" />
                  {t("sendForUserTest")}
                </button>
              ) : null}

              {canWithdraw ? (
                <button
                  type="button"
                  disabled={busy}
                  className="flex h-11 items-center justify-center gap-1 rounded-lg bg-surface-container-high font-label-md text-label-md font-semibold text-on-surface disabled:opacity-50"
                  onClick={onRequestWithdraw}
                >
                  <MaterialIcon className="text-[18px]" name="logout" />
                  {t("withdraw")}
                </button>
              ) : null}

              {canApprove ? (
                <button
                  type="button"
                  disabled={busy}
                  className="flex h-11 items-center justify-center gap-1 rounded-lg bg-primary font-label-md text-label-md font-semibold text-on-primary disabled:opacity-50"
                  onClick={() =>
                    void runAction(
                      () =>
                        tokenForThisTicket && confirmToken && !isAssignee
                          ? approveAndCloseWithToken(ticket.id, {
                              token: confirmToken,
                            })
                          : approveAndClose(ticket.id),
                      "approveAndCloseSuccess",
                    )
                  }
                >
                  <MaterialIcon className="text-[18px]" name="task_alt" />
                  {t("approveAndClose")}
                </button>
              ) : null}

              {canResend ? (
                <button
                  type="button"
                  disabled={busy}
                  className="flex h-10 items-center justify-center gap-1 rounded-lg bg-surface-container-highest px-3 font-label-md text-label-md text-on-surface disabled:opacity-50"
                  onClick={() =>
                    void runAction(() => resendConfirm(ticket.id), "resendSuccess")
                  }
                >
                  <MaterialIcon className="text-[18px]" name="outgoing_mail" />
                  {t("resend")}
                </button>
              ) : null}

              {canReportIssue || canReopen ? (
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-md text-label-md font-semibold text-on-surface">
                    {canReportIssue ? t("reportIssueReason") : t("reopenReason")}
                  </label>
                  <textarea
                    className="min-h-20 rounded-lg bg-surface-container-lowest p-2 font-body-sm text-body-sm text-on-surface"
                    value={reason}
                    disabled={busy}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    {t("evidence")}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    disabled={busy}
                    onChange={(event) =>
                      setEvidence(Array.from(event.target.files ?? []))
                    }
                  />
                  {canReportIssue ? (
                    <button
                      type="button"
                      disabled={busy || !reason.trim() || !confirmToken}
                      className="flex h-11 items-center justify-center gap-1 rounded-lg bg-error font-label-md text-label-md font-semibold text-on-error disabled:opacity-50"
                      onClick={() =>
                        void runAction(
                          () =>
                            reportIssueWithToken(ticket.id, {
                              token: confirmToken ?? "",
                              reason,
                              attachments: evidence,
                            }),
                          "reportIssueSuccess",
                        )
                      }
                    >
                      {t("reportIssue")}
                    </button>
                  ) : null}
                  {canReopen ? (
                    <button
                      type="button"
                      disabled={busy || !reason.trim()}
                      className="flex h-11 items-center justify-center gap-1 rounded-lg bg-tertiary font-label-md text-label-md font-semibold text-on-tertiary disabled:opacity-50"
                      onClick={() =>
                        void runAction(
                          () =>
                            tokenForThisTicket && confirmToken && !isAssignee
                              ? reopenTicketWithToken(ticket.id, {
                                  token: confirmToken,
                                  reason,
                                  attachments: evidence,
                                })
                              : reopenTicket(ticket.id, {
                                  reason,
                                  attachments: evidence,
                                }),
                          "reopenSuccess",
                        )
                      }
                    >
                      {t("reopen")}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : !currentUserId ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("guestReadOnly")}
            </p>
          ) : null}

          {currentUserId ? (
            <div className="flex justify-end pt-space-xs">
              <button
                type="button"
                disabled={busy}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error disabled:opacity-50"
                onClick={() => setPendingHardDelete(true)}
              >
                <MaterialIcon className="text-[16px]" name="delete" />
                {t("hardDelete")}
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <ProgressDeleteDialog
        open={Boolean(pendingDelete)}
        busy={busy}
        percent={pendingDelete?.percent ?? 0}
        summary={pendingDelete?.summary ?? ""}
        onClose={() => {
          if (!busy) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete) return;
          void runAction(
            () => deleteTicketProgressWorklog(ticket.id, pendingDelete.id),
            "progressDeleted",
          );
        }}
      />

      <HardDeleteDialog
        open={pendingHardDelete}
        busy={busy}
        ticketNo={ticket.ticketNo}
        onClose={() => {
          if (!busy) setPendingHardDelete(false);
        }}
        onConfirm={(confirmation) => {
          void (async () => {
            setBusy(true);
            try {
              await hardDeleteTicket(ticket.id, { confirmation });
              setPendingHardDelete(false);
              onTicketDeleted(ticket.id);
              onToast(t("hardDeleteSuccess"));
            } catch (err) {
              onToast(getApiErrorMessage(err));
            } finally {
              setBusy(false);
            }
          })();
        }}
      />

      <CollaboratorPickerDialog
        open={pickerOpen}
        busy={busy}
        loading={staffLoading}
        locale={locale}
        assignedIds={new Set([
          ticket.lead?.userId,
          ...ticket.collaborators.map((row) => row.userId),
        ].filter((id): id is string => Boolean(id)))}
        staff={staffOptions}
        onClose={() => {
          if (!busy) setPickerOpen(false);
        }}
        onPick={(userId) =>
          void runAction(
            () => addTicketCollaborator(ticket.id, { userId }),
            "detail.collaboratorAdded",
          )
        }
      />

      <CollaboratorRemoveDialog
        open={Boolean(pendingRemove)}
        busy={busy}
        name={pendingRemove?.name ?? ""}
        onClose={() => {
          if (!busy) setPendingRemove(null);
        }}
        onConfirm={() => {
          if (!pendingRemove) return;
          void runAction(
            () => removeTicketCollaborator(ticket.id, pendingRemove.userId),
            "detail.collaboratorRemoved",
          );
        }}
      />
    </div>
  );
}

function ProgressDeleteDialog({
  open,
  busy,
  percent,
  summary,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  percent: number;
  summary: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("kanban");
  const titleId = useId();

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-error-container/60 text-error">
            <MaterialIcon className="text-[26px]" name="delete" />
          </div>
          <h2
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            id={titleId}
          >
            {t("progressDeleteTitle")}
          </h2>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {t("progressDeleteBody")}
          </p>
          <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-on-surface">
            <span className="font-label-md text-label-md font-bold text-secondary">
              {t("progressReached", { percent })}
            </span>
            <span className="mt-1 block whitespace-pre-wrap">{summary}</span>
          </p>
          <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              {t("progressDeleteCancel")}
            </button>
            <button
              className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-error px-space-md font-label-md text-label-md font-bold text-on-error hover:opacity-90 disabled:opacity-60"
              disabled={busy}
              type="button"
              onClick={onConfirm}
            >
              <MaterialIcon className="text-[18px]" name="delete" />
              {busy ? t("actionBusy") : t("progressDeleteConfirmAction")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function confirmationMatchesTicketNo(confirmation: string, ticketNo: string): boolean {
  const normalize = (value: string) => value.trim().replace(/^#/, "").toLowerCase();
  const typed = normalize(confirmation);
  return typed.length > 0 && typed === normalize(ticketNo);
}

function HardDeleteDialog({
  open,
  busy,
  ticketNo,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  ticketNo: string;
  onClose: () => void;
  onConfirm: (confirmation: string) => void;
}) {
  const t = useTranslations("kanban");
  const titleId = useId();
  const [confirmation, setConfirmation] = useState("");
  const matches = confirmationMatchesTicketNo(confirmation, ticketNo);

  useEffect(() => {
    if (open) setConfirmation("");
  }, [open, ticketNo]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <form
          aria-labelledby={titleId}
          aria-modal="true"
          className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            if (!matches || busy) return;
            onConfirm(confirmation);
          }}
        >
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-error-container/60 text-error">
            <MaterialIcon className="text-[26px]" name="delete_forever" />
          </div>
          <h2
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            id={titleId}
          >
            {t("hardDeleteTitle")}
          </h2>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {t("hardDeleteBody")}
          </p>
          <label className="mt-space-md flex flex-col gap-space-2xs">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {t("hardDeleteConfirmLabel")}
            </span>
            <input
              autoFocus
              className="h-12 rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-error"
              disabled={busy}
              placeholder={ticketNo}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t("hardDeleteConfirmHint", { ticketNo })}
            </span>
          </label>
          <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              {t("hardDeleteCancel")}
            </button>
            <button
              className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-error px-space-md font-label-md text-label-md font-bold text-on-error hover:opacity-90 disabled:opacity-60"
              disabled={busy || !matches}
              type="submit"
            >
              <MaterialIcon className="text-[18px]" name="delete_forever" />
              {busy ? t("actionBusy") : t("hardDeleteConfirmAction")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function CollaboratorPickerDialog({
  open,
  busy,
  loading,
  locale,
  assignedIds,
  staff,
  onClose,
  onPick,
}: {
  open: boolean;
  busy: boolean;
  loading: boolean;
  locale: string;
  assignedIds: Set<string>;
  staff: OnDutyStaffDto[];
  onClose: () => void;
  onPick: (userId: string) => void;
}) {
  const t = useTranslations("kanban");
  const titleId = useId();
  const available = staff.filter((row) => !assignedIds.has(row.id));

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
            <MaterialIcon className="text-[26px]" name="person_add" />
          </div>
          <h2
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            id={titleId}
          >
            {t("detail.collaboratorPickerTitle")}
          </h2>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {t("detail.collaboratorPickerHint")}
          </p>
          <div className="mt-space-md flex max-h-80 flex-col gap-space-xs overflow-y-auto">
            {loading ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("detail.collaboratorPickerLoading")}
              </p>
            ) : available.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("detail.collaboratorPickerEmpty")}
              </p>
            ) : (
              available.map((person) => {
                const name = staffDisplayName(person, locale);
                return (
                  <button
                    key={person.id}
                    type="button"
                    disabled={busy}
                    className="flex w-full items-center gap-3 rounded-lg bg-surface-container-low p-2.5 text-left hover:bg-surface-container disabled:opacity-50"
                    onClick={() => onPick(person.id)}
                  >
                    <SafeAvatar
                      alt={name}
                      className="h-9 w-9 shrink-0 rounded-full"
                      src={resolveMediaUrl(person.avatarUrl)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-label-lg text-label-lg font-bold text-on-surface">
                        {name}
                      </span>
                      <span className="block font-label-md text-[11px] text-on-surface-variant">
                        {person.jobTitle || person.role}
                      </span>
                    </span>
                    <MaterialIcon className="text-[20px] text-secondary" name="add" />
                  </button>
                );
              })
            )}
          </div>
          <div className="mt-space-lg flex justify-end">
            <button
              className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              {t("progressEditCancel")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CollaboratorRemoveDialog({
  open,
  busy,
  name,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("kanban");
  const titleId = useId();

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-error-container/60 text-error">
            <MaterialIcon className="text-[26px]" name="person_remove" />
          </div>
          <h2
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            id={titleId}
          >
            {t("detail.removeCollaboratorTitle")}
          </h2>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {t("detail.removeCollaboratorBody")}
          </p>
          <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-md font-label-lg text-label-lg font-bold text-on-surface">
            {name}
          </p>
          <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              {t("detail.removeCollaboratorCancel")}
            </button>
            <button
              className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-error px-space-md font-label-md text-label-md font-bold text-on-error hover:opacity-90 disabled:opacity-60"
              disabled={busy}
              type="button"
              onClick={onConfirm}
            >
              <MaterialIcon className="text-[18px]" name="person_remove" />
              {busy ? t("actionBusy") : t("detail.removeCollaboratorConfirm")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
