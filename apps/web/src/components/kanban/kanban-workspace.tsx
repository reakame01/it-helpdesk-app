"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  kanbanAssignees,
  mockKanbanTickets,
  type KanbanColumnId,
  type KanbanTicket,
} from "@/lib/mock/kanban";
import { cn } from "@/lib/utils";
import { QuickLogDialog } from "@/components/kanban/quick-log-dialog";
import { TicketDetailDrawer } from "@/components/kanban/ticket-detail-drawer";

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

export function KanbanWorkspace() {
  const t = useTranslations("kanban");
  const [tickets, setTickets] = useState(mockKanbanTickets);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  function openTicketDetail(id: string) {
    setSelectedTicketId(id);
    setDrawerOpen(true);
  }

  function closeTicketDetail() {
    setDrawerOpen(false);
    window.setTimeout(() => setSelectedTicketId(null), 300);
  }

  function resolveSelectedTicket() {
    if (!selectedTicketId) return;
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === selectedTicketId
          ? {
              ...ticket,
              column: "resolved",
              progress: undefined,
              ageLabelKey: "ages.resolvedToday",
            }
          : ticket,
      ),
    );
    showToast(t("detail.resolveSuccess"));
    closeTicketDetail();
  }

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      if (assigneeFilter !== "all" && ticket.assigneeId !== assigneeFilter) {
        return false;
      }
      if (categoryFilter !== "all" && ticket.categoryKey !== `categories.${categoryFilter}`) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${ticket.id} ${t(ticket.titleKey)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, assigneeFilter, categoryFilter, query, t]);

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

  function claimTicket(id: string) {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              column: "in_progress",
              assigneeId: ticket.assigneeId ?? "golf",
              progress: ticket.progress ?? 15,
            }
          : ticket,
      ),
    );
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
            <span className="font-label-md text-label-md text-on-surface-variant">
              {t("sprint")}
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
          >
            <MaterialIcon className="text-[18px]" name="sync" />
            {t("refresh")}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-2 font-label-lg text-label-lg text-on-surface-variant shadow-sm transition-all hover:bg-surface-container hover:text-on-surface"
          >
            <MaterialIcon className="text-[18px]" name="tune" />
            {t("groupView")}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-label-lg text-label-lg text-on-secondary shadow-md transition-all hover:bg-on-secondary-container active:scale-95"
            onClick={() => setQuickLogOpen(true)}
          >
            <MaterialIcon className="text-[20px]" name="bolt" />
            {t("quickLog")}
          </button>
        </div>
      </div>

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
            {kanbanAssignees.map((person) => (
              <button
                key={person.id}
                type="button"
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-label-md text-label-md transition-all",
                  assigneeFilter === person.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container",
                )}
                onClick={() => setAssigneeFilter(person.id)}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    person.colorClass,
                  )}
                >
                  {person.initial}
                </span>
                <span>
                  {t(person.nameKey)}: {t(person.specialtyKey)}
                </span>
                <span className="rounded-full bg-surface-container px-1.5 text-[11px] text-on-surface-variant">
                  {person.count}
                </span>
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
            <button
              type="button"
              className="flex h-9 items-center gap-1 rounded-lg bg-surface-container-low px-2.5 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
            >
              <MaterialIcon className="text-[18px]" name="filter_list" />
              {t("filters")}
            </button>
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
          {(["hardware", "software", "network", "access", "feature"] as const).map(
            (key) => (
              <FilterChip
                key={key}
                active={categoryFilter === key}
                onClick={() => setCategoryFilter(key)}
              >
                {t(`categories.${key}`)}
              </FilterChip>
            ),
          )}
        </div>
      </div>

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
                {columnTickets.map((ticket) => (
                  <KanbanCard
                    key={ticket.id}
                    ticket={ticket}
                    onOpen={() => openTicketDetail(ticket.id)}
                    onClaim={() => claimTicket(ticket.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <QuickLogDialog
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSaved={() => showToast(t("quickLogDialog.success"))}
      />

      <TicketDetailDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        onClose={closeTicketDetail}
        onResolve={resolveSelectedTicket}
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
  onOpen,
  onClaim,
}: {
  ticket: KanbanTicket;
  onOpen: () => void;
  onClaim: () => void;
}) {
  const t = useTranslations("kanban");
  const assignee = kanbanAssignees.find((a) => a.id === ticket.assigneeId);

  return (
    <article
      role="button"
      tabIndex={0}
      className={cn(
        "flex cursor-pointer flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-md shadow-sm transition-shadow hover:shadow-md",
        ticket.priority === "urgent" && "border-l-4 border-l-error",
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
        <span className="font-label-md text-label-md font-bold text-primary">
          #{ticket.id}
        </span>
        <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary ring-1 ring-primary/20">
          {t(ticket.categoryKey)}
        </span>
      </div>
      <h3 className="font-headline-sm text-headline-sm leading-snug text-on-surface">
        {t(ticket.titleKey)}
      </h3>
      <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
        <MaterialIcon className="text-[18px]" name="apartment" />
        <span>{t(ticket.departmentKey)}</span>
      </div>

      {typeof ticket.progress === "number" ? (
        <div className="mt-space-2xs flex flex-col gap-1 rounded bg-surface-container-low p-space-xs">
          <div className="flex items-center justify-between text-body-sm">
            <span className="font-label-sm text-label-sm font-semibold text-secondary">
              {t("progress")}
            </span>
            <span className="font-label-sm text-label-sm font-bold text-primary">
              {ticket.progress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-2 rounded-full bg-secondary"
              style={{ width: `${ticket.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-space-xs flex items-center justify-between rounded bg-surface-container p-space-xs">
        {assignee ? (
          <div className="flex items-center gap-space-xs">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                assignee.colorClass,
              )}
            >
              {assignee.initial}
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm font-semibold leading-tight text-on-surface">
                {t(assignee.nameKey)}
              </span>
              <span className="text-xs leading-none text-on-surface-variant">
                {t(assignee.specialtyKey)}
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
          {t(ticket.ageLabelKey)}
        </span>
      </div>

      {ticket.column === "backlog" ? (
        <button
          type="button"
          className="mt-space-xs flex h-11 w-full items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-md text-label-md font-semibold text-on-secondary shadow-sm transition-transform hover:bg-on-secondary-container active:scale-[0.98]"
          onClick={(e) => {
            e.stopPropagation();
            onClaim();
          }}
        >
          <MaterialIcon className="text-[18px]" name="handshake" />
          {t("claim")}
        </button>
      ) : null}
    </article>
  );
}
