"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { BoardTicketDto, ConfirmTokenPeekDto, ReferenceItemDto } from "@helpdesk/types";
import { useItAuth } from "@/components/auth/it-auth-context";
import { MaterialIcon } from "@/components/shared/material-icon";
import { QuickLogDialog } from "@/components/kanban/quick-log-dialog";
import { TicketDetailDrawer } from "@/components/kanban/ticket-detail-drawer";
import {
  claimBoardTicket,
  createQuickLog,
  fetchBoardTickets,
  fetchReferenceItems,
  getApiErrorMessage,
  peekConfirmToken,
  withdrawBoardTicket,
} from "@/lib/api";
import {
  assigneeInitial,
  assigneeSwatch,
  boardPriority,
  categoryFilterKey,
  formatTicketAge,
  isQuickTicket,
  showsDevelopmentProgress,
  uniqueAssignees,
  type BoardCategoryFilter,
} from "@/lib/kanban/board-view";
import { cn } from "@/lib/utils";

type KanbanColumnId = BoardTicketDto["column"];

const COLUMNS: {
  id: KanbanColumnId;
  dotClass: string;
  badgeClass: string;
}[] = [
  {
    id: "backlog",
    dotClass: "bg-secondary",
    badgeClass: "bg-surface-container-high text-on-surface-variant",
  },
  {
    id: "in_progress",
    dotClass: "bg-primary",
    badgeClass: "bg-primary-fixed text-on-primary-fixed",
  },
  {
    id: "pending_user",
    dotClass: "bg-tertiary",
    badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    id: "resolved",
    dotClass: "bg-primary-container",
    badgeClass: "bg-surface-container-highest text-on-surface",
  },
];

const CATEGORY_FILTERS: BoardCategoryFilter[] = [
  "hardware",
  "software",
  "network",
  "access",
  "feature",
  "other",
];

export function KanbanWorkspace() {
  const t = useTranslations("kanban");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useItAuth();
  const [tickets, setTickets] = useState<BoardTicketDto[]>([]);
  const [departments, setDepartments] = useState<ReferenceItemDto[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<BoardCategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState<string | null>(null);
  const [tokenPeek, setTokenPeek] = useState<ConfirmTokenPeekDto | null>(null);
  const [pendingClaim, setPendingClaim] = useState<BoardTicketDto | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const [pendingWithdrawId, setPendingWithdrawId] = useState<string | null>(null);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [quickLogBusy, setQuickLogBusy] = useState(false);
  const [quickLogError, setQuickLogError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      const [board, deptRows] = await Promise.all([
        fetchBoardTickets(),
        fetchReferenceItems("departments", { activeOnly: true }).catch(
          () => [] as ReferenceItemDto[],
        ),
      ]);
      setTickets(board);
      setDepartments(deptRows);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    function onFocus() {
      void loadBoard();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadBoard]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setConfirmToken(null);
      setTokenPeek(null);
      return;
    }
    setConfirmToken(token);
    void peekConfirmToken(token)
      .then((peek) => {
        setTokenPeek(peek);
        setSelectedTicketId(peek.ticketId);
        setDrawerOpen(true);
      })
      .catch(() => {
        setTokenPeek(null);
        setToast(t("tokenInvalid"));
        window.setTimeout(() => setToast(null), 2500);
      });
  }, [searchParams, t]);

  useEffect(() => {
    if (searchParams.get("token")) return;
    const deepLink = searchParams.get("ticket");
    if (!deepLink || tickets.length === 0) return;
    const match = tickets.find(
      (ticket) => ticket.id === deepLink || ticket.ticketNo === deepLink,
    );
    if (!match) return;
    setSelectedTicketId(match.id);
    setDrawerOpen(true);
  }, [searchParams, tickets]);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const pendingWithdraw =
    tickets.find((ticket) => ticket.id === pendingWithdrawId) ?? null;
  const assignees = useMemo(() => uniqueAssignees(tickets), [tickets]);

  function departmentLabel(code: string): string {
    const item = departments.find((row) => row.code === code);
    if (!item) return code;
    return locale.startsWith("th") ? item.labelTh : item.labelEn;
  }

  function openTicketDetail(id: string) {
    setSelectedTicketId(id);
    setDrawerOpen(true);
  }

  function closeTicketDetail() {
    setDrawerOpen(false);
    window.setTimeout(() => setSelectedTicketId(null), 300);
  }

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      if (assigneeFilter !== "all") {
        const ids = [
          ticket.lead?.userId,
          ...ticket.collaborators.map((row) => row.userId),
        ].filter(Boolean);
        if (!ids.includes(assigneeFilter)) return false;
      }
      if (
        categoryFilter !== "all" &&
        categoryFilterKey(ticket.categoryCode) !== categoryFilter
      ) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay =
          `${ticket.ticketNo} ${ticket.title} ${ticket.requesterName} ${ticket.requesterEmail}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, assigneeFilter, categoryFilter, query]);

  const counts = useMemo(() => {
    const byColumn = Object.fromEntries(
      COLUMNS.map((c) => [c.id, filtered.filter((x) => x.column === c.id).length]),
    ) as Record<KanbanColumnId, number>;
    return {
      total: filtered.length,
      backlog: byColumn.backlog,
      inProgress: byColumn.in_progress,
      pendingUser: byColumn.pending_user,
      resolved: byColumn.resolved,
    };
  }, [filtered]);

  async function claimTicket(id: string) {
    if (!isAuthenticated) return;
    setClaimBusy(true);
    try {
      const updated = await claimBoardTicket(id);
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === id ? updated : ticket)),
      );
      setPendingClaim(null);
      showToast(t("claimSuccess"));
    } catch (err) {
      showToast(getApiErrorMessage(err));
    } finally {
      setClaimBusy(false);
    }
  }

  async function withdrawTicket(id: string) {
    if (!isAuthenticated) return;
    setWithdrawBusy(true);
    try {
      const updated = await withdrawBoardTicket(id);
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === id ? updated : ticket)),
      );
      setPendingWithdrawId(null);
      showToast(t("withdrawSuccess"));
    } catch (err) {
      showToast(getApiErrorMessage(err));
    } finally {
      setWithdrawBusy(false);
    }
  }

  async function submitQuickLog(input: {
    departmentCode: string;
    issue: string;
    resolve: string;
    requesterName?: string;
  }) {
    setQuickLogBusy(true);
    setQuickLogError(null);
    try {
      const created = await createQuickLog(input);
      setTickets((prev) => [created, ...prev.filter((row) => row.id !== created.id)]);
      setQuickLogOpen(false);
      showToast(t("quickLogDialog.success"));
    } catch (err) {
      setQuickLogError(getApiErrorMessage(err));
    } finally {
      setQuickLogBusy(false);
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-space-md py-1 font-label-sm text-label-sm text-on-secondary-container">
              <MaterialIcon className="text-[16px]" name="hub" />
              {t("badge")}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            {t("title")}
          </h1>
          <p className="max-w-3xl font-body-sm text-body-sm text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-2 font-label-lg text-label-lg text-on-surface-variant shadow-sm transition-all hover:bg-surface-container hover:text-on-surface"
            onClick={() => {
              setLoading(true);
              void loadBoard();
            }}
          >
            <MaterialIcon className="text-[18px]" name="sync" />
            {t("refresh")}
          </button>
          {isAuthenticated ? (
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-label-lg text-label-lg text-on-secondary shadow-md transition-all hover:bg-on-secondary-container active:scale-95"
              onClick={() => {
                setQuickLogError(null);
                setQuickLogOpen(true);
              }}
            >
              <MaterialIcon className="text-[20px]" name="bolt" />
              {t("quickLog")}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-error-container/40 px-3 py-2 font-body-sm text-body-sm text-error">
          {t("loadError")}: {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-space-sm md:grid-cols-4">
        <MetricCard
          icon="assignment"
          label={t("metrics.totalToday")}
          value={`${counts.total}`}
          unit={t("metrics.totalUnit")}
          tone="error"
        />
        <MetricCard
          icon="inbox"
          label={t("metrics.backlog")}
          value={`${counts.backlog}`}
          unit={t("metrics.totalUnit")}
          tone="primary"
        />
        <MetricCard
          icon="engineering"
          label={t("metrics.inProgress")}
          value={`${counts.inProgress}`}
          unit={t("metrics.totalUnit")}
          tone="secondary"
        />
        <MetricCard
          icon="task_alt"
          label={t("metrics.pendingUser")}
          value={`${counts.pendingUser}`}
          unit={t("metrics.totalUnit")}
          tone="tertiary"
        />
      </div>

      <div className="mb-space-sm flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
        <div className="flex flex-col justify-between gap-space-sm lg:flex-row lg:items-center">
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 lg:pb-0">
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-label-md text-label-md text-on-surface-variant">
              <MaterialIcon className="text-[16px]" name="groups" />
              {t("assigneeLabel")}
            </span>
            <FilterChip
              active={assigneeFilter === "all"}
              onClick={() => setAssigneeFilter("all")}
            >
              {t("allAssignees")} ({tickets.length})
            </FilterChip>
            {assignees.map((person) => (
              <button
                key={person.userId}
                type="button"
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-label-md text-label-md transition-all",
                  assigneeFilter === person.userId
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container",
                )}
                onClick={() => setAssigneeFilter(person.userId)}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    assigneeSwatch(person.userId),
                  )}
                >
                  {assigneeInitial(person.name)}
                </span>
                <span>{person.name}</span>
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-space-xs">
            <div className="relative flex items-center">
              <MaterialIcon
                className="absolute left-2.5 text-[18px] text-outline"
                name="search"
              />
              <input
                className="h-9 w-40 rounded-lg bg-surface-container-low pl-8 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary sm:w-48"
                placeholder={t("filterSearch")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="shrink-0 font-label-md text-label-md text-on-surface-variant">
            {t("categoryLabel")}
          </span>
          <FilterChip
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          >
            {t("categoryAll")}
          </FilterChip>
          {CATEGORY_FILTERS.map((key) => (
            <FilterChip
              key={key}
              active={categoryFilter === key}
              onClick={() => setCategoryFilter(key)}
            >
              {t(`categories.${key}`)}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading && tickets.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("loading")}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-space-sm xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnTickets = filtered.filter((x) => x.column === column.id);
          return (
            <section
              key={column.id}
              className="flex flex-col rounded-2xl bg-surface-container-low/80 p-space-sm"
            >
              <div className="mb-space-xs flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-3 w-3 rounded-full", column.dotClass)} />
                  <h2 className="font-title-md text-title-md font-bold text-on-surface">
                    {t(`columns.${column.id}`)}
                  </h2>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-label-md text-label-md font-bold",
                    column.badgeClass,
                  )}
                >
                  {columnTickets.length}
                </span>
              </div>
              <div className="flex flex-col gap-space-sm">
                {columnTickets.length === 0 ? (
                  <p className="px-2 py-4 font-body-sm text-body-sm text-on-surface-variant">
                    {t("emptyColumn")}
                  </p>
                ) : (
                  columnTickets.map((ticket) => (
                    <KanbanCard
                      key={ticket.id}
                      ticket={ticket}
                      departmentLabel={departmentLabel(ticket.departmentCode)}
                      canClaim={isAuthenticated}
                      locale={locale}
                      onOpen={() => openTicketDetail(ticket.id)}
                      onClaim={() => setPendingClaim(ticket)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <QuickLogDialog
        open={quickLogOpen}
        departments={departments}
        busy={quickLogBusy}
        error={quickLogError}
        onClose={() => {
          if (quickLogBusy) return;
          setQuickLogOpen(false);
          setQuickLogError(null);
        }}
        onSubmit={submitQuickLog}
      />

      <ClaimConfirmDialog
        ticket={pendingClaim}
        busy={claimBusy}
        onClose={() => {
          if (!claimBusy) setPendingClaim(null);
        }}
        onConfirm={() => {
          if (!pendingClaim) return;
          void claimTicket(pendingClaim.id);
        }}
      />

      <WithdrawConfirmDialog
        ticket={pendingWithdraw}
        currentUserId={user?.id ?? null}
        busy={withdrawBusy}
        onClose={() => {
          if (!withdrawBusy) setPendingWithdrawId(null);
        }}
        onConfirm={() => {
          if (!pendingWithdraw) return;
          void withdrawTicket(pendingWithdraw.id);
        }}
      />

      <TicketDetailDrawer
        ticket={selectedTicket}
        departmentLabel={
          selectedTicket ? departmentLabel(selectedTicket.departmentCode) : ""
        }
        open={drawerOpen}
        currentUserId={user?.id ?? null}
        confirmToken={confirmToken}
        tokenPeek={tokenPeek}
        onClose={closeTicketDetail}
        onTicketUpdated={(updated) => {
          setTickets((prev) =>
            prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
          );
        }}
        onToast={showToast}
        onTicketDeleted={(ticketId) => {
          setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
          closeTicketDetail();
        }}
        onRequestClaim={() => {
          if (selectedTicket) setPendingClaim(selectedTicket);
        }}
        onRequestWithdraw={() => {
          if (selectedTicket) setPendingWithdrawId(selectedTicket.id);
        }}
      />

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-primary px-4 py-3 font-label-md text-label-md text-on-primary shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  tone: "error" | "primary" | "secondary" | "tertiary";
}) {
  const toneClass = {
    error: "bg-error-container/60 text-error",
    primary: "bg-primary-fixed/50 text-primary",
    secondary: "bg-secondary-container/50 text-on-secondary-container",
    tertiary: "bg-tertiary-fixed/60 text-on-tertiary-fixed-variant",
  }[tone];

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
      <div className="flex flex-col">
        <span className="font-label-md text-label-md text-on-surface-variant">
          {label}
        </span>
        <span className="font-headline-md text-headline-md font-bold text-on-surface">
          {value}{" "}
          <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">
            {unit}
          </span>
        </span>
      </div>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          toneClass,
        )}
      >
        <MaterialIcon className="text-[22px]" name={icon} />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "whitespace-nowrap rounded-lg px-2.5 py-1 font-label-md text-label-md transition-colors",
        active
          ? "bg-surface-container-highest text-on-surface"
          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function KanbanCard({
  ticket,
  departmentLabel,
  canClaim,
  locale,
  onOpen,
  onClaim,
}: {
  ticket: BoardTicketDto;
  departmentLabel: string;
  canClaim: boolean;
  locale: string;
  onOpen: () => void;
  onClaim: () => void;
}) {
  const t = useTranslations("kanban");
  const lead = ticket.lead;
  const categoryKey = categoryFilterKey(ticket.categoryCode);
  const urgent = boardPriority(ticket.priority) === "urgent";

  return (
    <article
      role="button"
      tabIndex={0}
      className={cn(
        "flex cursor-pointer flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-md shadow-sm transition-shadow hover:shadow-md",
        urgent && "border-l-4 border-l-error",
        ticket.column === "in_progress" && "border-l-4 border-l-secondary",
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="flex flex-wrap items-center gap-1.5 font-label-md text-label-md font-bold text-primary">
          {ticket.ticketNo}
          {isQuickTicket(ticket) ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container">
              <MaterialIcon className="text-[14px]" name="bolt" />
              {t("quickLogBadge")}
            </span>
          ) : null}
        </span>
        <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary ring-1 ring-primary/20">
          {t(`categories.${categoryKey}`)}
        </span>
      </div>
      <h3 className="font-headline-sm text-headline-sm leading-snug text-on-surface">
        {ticket.title}
      </h3>
      <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
        <MaterialIcon className="text-[18px]" name="apartment" />
        <span>{departmentLabel}</span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {ticket.requesterName === "Walk-up"
          ? t("quickLogUnnamed")
          : ticket.requesterName}
        {ticket.extension && ticket.extension !== "-" ? ` · ${ticket.extension}` : ""}
      </p>

      {showsDevelopmentProgress(ticket) ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>{t("progress")}</span>
            <span className="font-semibold text-on-surface">
              {ticket.progress ?? 0}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${Math.min(100, Math.max(0, ticket.progress ?? 0))}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-space-xs flex items-center justify-between rounded bg-surface-container p-space-xs">
        {lead ? (
          <div className="flex items-center gap-space-xs">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                assigneeSwatch(lead.userId),
              )}
            >
              {assigneeInitial(lead.name)}
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm font-semibold leading-tight text-on-surface">
                {lead.name}
              </span>
              <span className="text-xs leading-none text-on-surface-variant">
                {lead.jobTitle || t("detail.role.lead")}
              </span>
            </div>
          </div>
        ) : (
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {t("unassigned")}
          </span>
        )}
        <span className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
          <MaterialIcon className="text-[16px]" name="timelapse" />
          {formatTicketAge(ticket.createdAt, locale)}
        </span>
      </div>

      {ticket.column === "backlog" ? (
        <button
          type="button"
          disabled={!canClaim}
          className="mt-space-xs flex h-11 w-full items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-md text-label-md font-semibold text-on-secondary shadow-sm transition-transform hover:bg-on-secondary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(e) => {
            e.stopPropagation();
            onClaim();
          }}
        >
          <MaterialIcon className="text-[18px]" name="handshake" />
          {canClaim ? t("claim") : t("claimGuestDisabled")}
        </button>
      ) : null}
    </article>
  );
}

function ClaimConfirmDialog({
  ticket,
  busy,
  onClose,
  onConfirm,
}: {
  ticket: BoardTicketDto | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("kanban");
  const titleId = useId();

  useEffect(() => {
    if (!ticket) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ticket, busy, onClose]);

  if (!ticket || typeof document === "undefined") return null;

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
            <MaterialIcon className="text-[26px]" name="handshake" />
          </div>
          <h2
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            id={titleId}
          >
            {t("claimConfirmTitle")}
          </h2>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {t("claimConfirmBody")}
          </p>
          <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-md">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              {ticket.ticketNo}
            </span>
            <span className="mt-1 block font-body-sm text-body-sm text-on-surface">
              {ticket.title}
            </span>
          </p>
          <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              {t("claimConfirmCancel")}
            </button>
            <button
              className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-md font-label-md text-label-md font-bold text-on-secondary hover:bg-on-secondary-container disabled:opacity-60"
              disabled={busy}
              type="button"
              onClick={onConfirm}
            >
              <MaterialIcon className="text-[18px]" name="handshake" />
              {busy ? t("actionBusy") : t("claimConfirmAction")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WithdrawConfirmDialog({
  ticket,
  currentUserId,
  busy,
  onClose,
  onConfirm,
}: {
  ticket: BoardTicketDto | null;
  currentUserId: string | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("kanban");
  const titleId = useId();

  useEffect(() => {
    if (!ticket) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ticket, busy, onClose]);

  if (!ticket || typeof document === "undefined") return null;

  const isLead = Boolean(currentUserId && ticket.lead?.userId === currentUserId);
  const successor = ticket.collaborators[0] ?? null;
  const body = isLead && !successor
    ? t("withdrawConfirmBodyLast")
    : isLead && successor
      ? t("withdrawConfirmBodyLead", { name: successor.name })
      : t("withdrawConfirmBodyCollab");

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
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary text-on-tertiary">
            <MaterialIcon className="text-[26px]" name="logout" />
          </div>
          <h2
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            id={titleId}
          >
            {t("withdrawConfirmTitle")}
          </h2>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {body}
          </p>
          <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-md">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              {ticket.ticketNo}
            </span>
            <span className="mt-1 block font-body-sm text-body-sm text-on-surface">
              {ticket.title}
            </span>
          </p>
          <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              {t("withdrawConfirmCancel")}
            </button>
            <button
              className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-tertiary px-space-md font-label-md text-label-md font-bold text-on-tertiary hover:opacity-90 disabled:opacity-60"
              disabled={busy}
              type="button"
              onClick={onConfirm}
            >
              <MaterialIcon className="text-[18px]" name="logout" />
              {busy ? t("actionBusy") : t("withdrawConfirmAction")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
