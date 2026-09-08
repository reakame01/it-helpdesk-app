"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  dashboardAssignees,
  dashboardDepartments,
  dashboardMonths,
  dashboardYears,
  filterHistoryRows,
  getDashboardSnapshot,
  getDefaultDashboardFilters,
  type DashboardFilters,
  type HistoryStatus,
  type ReportRangeMode,
  type WorkCycleId,
} from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

export function DashboardWorkspace() {
  const t = useTranslations("dashboard");
  const [draft, setDraft] = useState<DashboardFilters>(getDefaultDashboardFilters);
  const [applied, setApplied] = useState<DashboardFilters>(getDefaultDashboardFilters);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const snapshot = useMemo(() => getDashboardSnapshot(applied), [applied]);
  const isAggregate = applied.rangeMode !== "cycle";
  const rangeLabel = useMemo(() => {
    if (applied.rangeMode === "month") {
      return t(`range.months.${applied.monthId}`);
    }
    if (applied.rangeMode === "year") {
      return t(`range.years.${applied.yearId}`);
    }
    return applied.workCycleId === "previous"
      ? t("filters.cyclePrevious")
      : t("filters.cycleCurrent");
  }, [applied, t]);

  const filteredHistory = useMemo(() => {
    return filterHistoryRows(snapshot.history, applied).filter((row) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const hay = [row.ticketCode, t(row.requesterNameKey), t(row.titleKey)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [snapshot.history, applied, query, t]);

  const pageCount = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const pageRows = filteredHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  function resetFilters() {
    const next = getDefaultDashboardFilters();
    setDraft(next);
    setApplied(next);
    setQuery("");
    setPage(1);
  }

  function setRangeMode(mode: ReportRangeMode) {
    setDraft((prev) => ({ ...prev, rangeMode: mode }));
  }

  return (
    <div className="flex flex-col gap-space-2xl">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
          <div className="flex flex-col gap-space-xs">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-space-md py-1 font-label-sm text-label-sm font-semibold text-secondary">
                <MaterialIcon className="text-[16px]" name="verified" />
                {t("badge")}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                {t("realtimeHint")}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              {t("title")}
            </h1>
            <p className="max-w-3xl font-body-sm text-body-sm text-on-surface-variant">
              {t("subtitle")}
            </p>
            <p className="font-label-md text-label-md font-semibold text-primary">
              {t("range.viewing", { range: rangeLabel })}
              {snapshot.cycleBreakdown
                ? ` · ${t("range.cyclesIncluded", { count: snapshot.cycleBreakdown.length })}`
                : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            <button
              type="button"
              className="flex h-11 items-center gap-1.5 rounded-lg bg-surface-container-low px-4 font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-surface-container"
              onClick={() => showToast(t("toast.excelRange", { range: rangeLabel }))}
            >
              <MaterialIcon className="text-[18px]" name="table_view" />
              {t("exportExcel")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 font-label-md text-label-md font-semibold text-on-primary shadow-md transition-colors hover:bg-primary-container"
              onClick={() => showToast(t("toast.pdfRange", { range: rangeLabel }))}
            >
              <MaterialIcon className="text-[18px]" name="picture_as_pdf" />
              {t("exportPdf")}
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-col gap-space-xs">
          <p className="font-label-md text-label-md font-semibold text-on-surface">
            {t("range.modeLabel")}
          </p>
          <div className="flex flex-wrap gap-1 rounded-xl bg-surface-container-low p-1">
            {(
              [
                { id: "cycle" as const, icon: "view_week", label: t("range.modes.cycle") },
                { id: "month" as const, icon: "calendar_month", label: t("range.modes.month") },
                { id: "year" as const, icon: "calendar_today", label: t("range.modes.year") },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={cn(
                  "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 font-label-md text-label-md font-semibold transition-colors sm:flex-none sm:min-w-[8.5rem]",
                  draft.rangeMode === mode.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                )}
                onClick={() => setRangeMode(mode.id)}
              >
                <MaterialIcon className="text-[18px]" name={mode.icon} />
                {mode.label}
              </button>
            ))}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t(`range.modeHints.${draft.rangeMode}`)}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-space-md">
          {draft.rangeMode === "cycle" ? (
            <FilterField label={t("filters.workCycle")}>
              <select
                className="h-11 w-full min-w-[14rem] appearance-none rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                value={draft.workCycleId}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    workCycleId: e.target.value as WorkCycleId,
                  }))
                }
              >
                <option value="current">{t("filters.cycleCurrent")}</option>
                <option value="previous">{t("filters.cyclePrevious")}</option>
              </select>
            </FilterField>
          ) : null}

          {draft.rangeMode === "month" ? (
            <FilterField label={t("range.monthLabel")}>
              <select
                className="h-11 w-full min-w-[14rem] appearance-none rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                value={draft.monthId}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, monthId: e.target.value }))
                }
              >
                {dashboardMonths.map((id) => (
                  <option key={id} value={id}>
                    {t(`range.months.${id}`)}
                  </option>
                ))}
              </select>
            </FilterField>
          ) : null}

          {draft.rangeMode === "year" ? (
            <FilterField label={t("range.yearLabel")}>
              <select
                className="h-11 w-full min-w-[10rem] appearance-none rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                value={draft.yearId}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, yearId: e.target.value }))
                }
              >
                {dashboardYears.map((id) => (
                  <option key={id} value={id}>
                    {t(`range.years.${id}`)}
                  </option>
                ))}
              </select>
            </FilterField>
          ) : null}

          <FilterField label={t("filters.department")}>
            <select
              className="h-11 w-full min-w-[12rem] appearance-none rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              value={draft.departmentId}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, departmentId: e.target.value }))
              }
            >
              <option value="all">{t("filters.allDepartments")}</option>
              {dashboardDepartments.map((id) => (
                <option key={id} value={id}>
                  {t(`departments.${id}`)}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label={t("filters.assignee")}>
            <select
              className="h-11 w-full min-w-[12rem] appearance-none rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              value={draft.assigneeId}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, assigneeId: e.target.value }))
              }
            >
              <option value="all">{t("filters.allAssignees")}</option>
              {dashboardAssignees.map((id) => (
                <option key={id} value={id}>
                  {t(`staff.${id}`)}
                </option>
              ))}
            </select>
          </FilterField>
          <div className="flex flex-wrap gap-space-xs">
            <button
              type="button"
              className="flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 font-label-md text-label-md font-semibold text-on-primary"
              onClick={applyFilters}
            >
              <MaterialIcon className="text-[18px]" name="filter_alt" />
              {t("filters.apply")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center gap-1.5 rounded-lg bg-surface-container-low px-4 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
              onClick={resetFilters}
            >
              <MaterialIcon className="text-[18px]" name="restart_alt" />
              {t("filters.reset")}
            </button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="task_alt"
          iconClass="bg-secondary-container text-on-secondary-container"
          label={t("kpis.resolved")}
          value={`${snapshot.kpis.resolved} / ${snapshot.kpis.total}`}
          badge={t("kpis.trendUp", { pct: snapshot.kpis.trendPct })}
          badgeTone="positive"
        >
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("kpis.successRate", { rate: snapshot.kpis.successRate })}
          </p>
          <div className="mt-space-xs flex flex-wrap gap-2 rounded bg-surface-container-low px-2 py-1 font-label-sm text-label-sm text-on-surface-variant">
            <span>
              {t("kpis.portal")}: {snapshot.kpis.portalResolved}
            </span>
            <span>·</span>
            <span>
              {t("kpis.quickTicket")}: {snapshot.kpis.quickTicketResolved}
            </span>
          </div>
        </KpiCard>

        <KpiCard
          icon="speed"
          iconClass="bg-primary-fixed text-on-primary-fixed"
          label={t("kpis.firstResponse")}
          value={`${snapshot.kpis.firstResponseMinutes}`}
          unit={t("kpis.minutes")}
          badge={t("kpis.fasterThanSla")}
          badgeTone="positive"
        >
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("kpis.firstResponseHint")}
          </p>
        </KpiCard>

        <KpiCard
          icon="timer"
          iconClass="bg-surface-container-high text-primary"
          label={t("kpis.resolution")}
          value={`${snapshot.kpis.resolutionHours}`}
          unit={t("kpis.hours")}
          badge={t("kpis.mttrStable")}
          badgeTone="neutral"
        >
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("kpis.resolutionHint")}
          </p>
        </KpiCard>

        <KpiCard
          icon="sentiment_satisfied"
          iconClass="bg-tertiary-fixed text-on-tertiary-fixed-variant"
          label={t("kpis.csat")}
          value={`${snapshot.kpis.csat}`}
          unit={`/ ${t("kpis.csatMax")}`}
          badge={t("kpis.csatExcellent")}
          badgeTone="positive"
        >
          <div className="mt-space-xs h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-2 rounded-full bg-secondary"
              style={{ width: `${snapshot.kpis.csatPct}%` }}
            />
          </div>
          <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
            {t("kpis.csatRespondents", { count: snapshot.kpis.csatRespondents })}
          </p>
        </KpiCard>
      </section>

      {/* Cycle breakdown for month/year */}
      {isAggregate && snapshot.cycleBreakdown ? (
        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="border-b border-surface-container p-space-lg">
            <h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <MaterialIcon className="text-[22px] text-primary" name="stacked_bar_chart" />
              {t("range.breakdownTitle")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {t("range.breakdownSubtitle", { range: rangeLabel })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr className="font-label-md text-label-md text-on-surface-variant">
                  <th className="px-space-md py-3 font-semibold">
                    {t("range.breakdownCols.cycle")}
                  </th>
                  <th className="px-space-md py-3 font-semibold">
                    {t("range.breakdownCols.dates")}
                  </th>
                  <th className="px-space-md py-3 font-semibold">
                    {t("range.breakdownCols.resolved")}
                  </th>
                  <th className="px-space-md py-3 font-semibold">
                    {t("range.breakdownCols.success")}
                  </th>
                  <th className="px-space-md py-3 font-semibold">
                    {t("range.breakdownCols.carryover")}
                  </th>
                  <th className="px-space-md py-3 font-semibold">
                    {t("range.breakdownCols.sla")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.cycleBreakdown.map((row) => (
                  <tr
                    key={row.cycleNumber}
                    className="border-t border-surface-container font-body-sm text-body-sm text-on-surface"
                  >
                    <td className="px-space-md py-3 font-semibold text-primary">
                      {t("delivery.cycleChip", { n: row.cycleNumber })}
                    </td>
                    <td className="px-space-md py-3 text-on-surface-variant">
                      {t(row.dateRangeKey)}
                    </td>
                    <td className="px-space-md py-3">
                      {row.resolved} / {row.total}
                    </td>
                    <td className="px-space-md py-3">{row.successRate}%</td>
                    <td className="px-space-md py-3">{row.carryoverOut}</td>
                    <td className="px-space-md py-3">{row.slaPassPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Delivery */}
      <section className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <div className="mb-space-md flex flex-col justify-between gap-space-sm border-b border-surface-container pb-space-md lg:flex-row lg:items-center">
          <div>
            <h2 className="font-title-md text-title-md font-bold text-on-surface">
              {isAggregate ? t("delivery.titleAggregate") : t("delivery.title")}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {isAggregate
                ? t("delivery.subtitleAggregate")
                : t("delivery.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-space-xs">
            <Chip icon="calendar_month">
              {isAggregate
                ? rangeLabel
                : t("delivery.cycleChip", { n: snapshot.delivery.cycleNumber })}
            </Chip>
            <Chip icon="trending_up" tone="secondary">
              {t("delivery.deliveryChip", { pct: snapshot.delivery.deliveryPct })}
            </Chip>
            <Chip icon="check_circle" tone="success">
              {snapshot.delivery.onSchedule
                ? t("delivery.onSchedule")
                : t("delivery.offSchedule")}
            </Chip>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-4">
          <DeliveryTile
            icon="rocket_launch"
            iconClass="bg-secondary-container text-on-secondary-container"
            label={t("delivery.delivered")}
            value={snapshot.delivery.delivered}
            unit={t("delivery.items")}
            footer={t("delivery.deliveredFooter")}
          />
          <DeliveryTile
            icon="construction"
            iconClass="bg-primary-fixed text-on-primary-fixed"
            label={t("delivery.inProgress")}
            value={snapshot.delivery.inProgress}
            unit={t("delivery.items")}
            footer={snapshot.delivery.inProgressTitles
              .map((key) => t(key))
              .join(" · ")}
          />
          <DeliveryTile
            icon="science"
            iconClass="bg-surface-container-high text-primary"
            label={t("delivery.uat")}
            value={snapshot.delivery.uat}
            unit={t("delivery.items")}
            footer={t("delivery.uatFooter")}
          />
          <DeliveryTile
            icon="move_up"
            iconClass="bg-tertiary-fixed text-on-tertiary-fixed-variant"
            label={t("delivery.carryover")}
            value={snapshot.delivery.carryover}
            unit={t("delivery.items")}
            footer={t("delivery.carryoverFooter")}
          />
        </div>
      </section>

      {/* Staff */}
      <section className="flex flex-col gap-space-md">
        <div className="flex items-center gap-space-xs">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">
            {t("staffSection.title")}
          </h2>
          <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-secondary">
            {t("staffSection.badge")}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {snapshot.staff.map((person) => (
            <article
              key={person.id}
              className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-space-sm">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold",
                      person.colorClass,
                    )}
                  >
                    {person.initial}
                  </span>
                  <div>
                    <p className="font-label-lg text-label-lg font-bold text-on-surface">
                      {t(person.nameKey)}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {t(person.roleKey)} · {t("staffSection.ext", { n: person.ext })}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-container">
                  {person.csat} {t("staffSection.stars")}
                </span>
              </div>
              <div className="rounded-lg bg-surface-container-low p-space-md">
                <p className="mb-1 font-label-sm text-label-sm font-semibold text-on-surface-variant">
                  {t("staffSection.scope")}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface">
                  {t(person.scopeKey)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-space-xs">
                <div className="rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {t("staffSection.resolved")}
                  </p>
                  <p className="font-headline-sm text-headline-sm font-bold text-primary">
                    {person.resolved}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {t("staffSection.successRate")}
                  </p>
                  <p className="font-headline-sm text-headline-sm font-bold text-primary">
                    {person.successRate}%
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">
                    {t("staffSection.workload")}
                  </span>
                  <span className="font-bold text-on-surface">{person.workloadPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className={cn("h-2.5 rounded-full", person.barClass)}
                    style={{ width: `${person.workloadPct}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between gap-2 border-t border-surface-container pt-space-sm font-label-sm text-label-sm text-on-surface-variant">
                <span>{t(person.footerLeftKey)}</span>
                <span>{t(person.footerRightKey)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Analytics */}
      <section className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-xl shadow-sm lg:col-span-7">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">
            {t("analytics.categoryTitle")}
          </h2>
          <div className="flex flex-col items-center gap-space-lg sm:flex-row">
            <CategoryDonut
              slices={snapshot.categories}
              total={snapshot.categoryTotal}
              totalLabel={t("analytics.totalCases")}
            />
            <div className="flex w-full flex-1 flex-col gap-space-sm">
              {snapshot.categories.map((slice) => (
                <div key={slice.id}>
                  <div className="mb-1 flex justify-between font-label-md text-label-md">
                    <span className="text-on-surface">{t(slice.labelKey)}</span>
                    <span className="font-semibold text-on-surface-variant">
                      {slice.count} ({slice.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                    <div
                      className={cn("h-2 rounded-full", slice.colorClass)}
                      style={{ width: `${slice.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-surface-container-low p-space-md">
            <p className="mb-1 flex items-center gap-1 font-label-md text-label-md font-bold text-primary">
              <MaterialIcon className="text-[18px]" name="lightbulb" />
              {t("analytics.insightTitle")}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t(snapshot.insightKey)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-xl shadow-sm lg:col-span-5">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">
            {t("analytics.deptTitle")}
          </h2>
          <div className="flex flex-col gap-space-sm">
            {snapshot.departments.map((dept) => (
              <div key={dept.id}>
                <div className="mb-1 flex justify-between font-label-md text-label-md">
                  <span className="text-on-surface">{t(dept.labelKey)}</span>
                  <span className="font-semibold text-on-surface-variant">
                    {dept.count}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={cn("h-3 rounded-full", dept.barClass)}
                    style={{ width: `${dept.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto rounded-xl bg-surface-container-high/60 p-space-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              {t("analytics.slaLabel")}
            </p>
            <div className="mt-1 flex items-end justify-between">
              <p className="font-headline-md text-headline-md font-bold text-primary">
                {t("analytics.slaPass", { pct: snapshot.slaPassPct })}
              </p>
              <span className="rounded-lg bg-secondary-container px-2.5 py-1 font-label-md text-label-md font-bold text-on-secondary-container">
                {t("analytics.grade", { grade: snapshot.slaGrade })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket History */}
      <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col justify-between gap-space-md border-b border-surface-container p-space-lg md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <MaterialIcon className="text-[22px] text-primary" name="history" />
              {t("history.title")}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("history.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            <div className="relative">
              <MaterialIcon
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                name="search"
              />
              <input
                className="h-11 w-full min-w-[16rem] rounded-lg bg-surface-container-low pl-10 pr-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("history.searchPlaceholder")}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button
              type="button"
              className="flex h-11 items-center gap-1.5 rounded-lg bg-surface-container-low px-3 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
              onClick={() => showToast(t("toast.print"))}
            >
              <MaterialIcon className="text-[18px]" name="print" />
              {t("history.print")}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr className="font-label-md text-label-md text-on-surface-variant">
                <th className="px-space-md py-3 font-semibold">{t("history.cols.when")}</th>
                <th className="px-space-md py-3 font-semibold">{t("history.cols.code")}</th>
                <th className="px-space-md py-3 font-semibold">{t("history.cols.requester")}</th>
                <th className="px-space-md py-3 font-semibold">{t("history.cols.problem")}</th>
                <th className="px-space-md py-3 font-semibold">{t("history.cols.assignee")}</th>
                <th className="px-space-md py-3 font-semibold">{t("history.cols.duration")}</th>
                <th className="px-space-md py-3 font-semibold">{t("history.cols.status")}</th>
                <th className="px-space-md py-3 font-semibold">{t("history.cols.note")}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const staff = snapshot.staff.find((s) => s.id === row.assigneeId);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-surface-container font-body-sm text-body-sm text-on-surface",
                      row.highlight === "dev" && "bg-primary/5",
                      row.highlight === "pending" && "bg-tertiary-fixed/20",
                    )}
                  >
                    <td className="px-space-md py-3 align-top">
                      <div className="font-semibold">{t(row.dateKey)}</div>
                      <div className="text-on-surface-variant">{t(row.timeKey)}</div>
                    </td>
                    <td className="px-space-md py-3 align-top">
                      <span className="rounded bg-primary-fixed/50 px-2 py-0.5 font-label-sm text-label-sm font-bold tracking-wide text-primary">
                        {row.ticketCode}
                      </span>
                      {row.originCycle ? (
                        <div className="mt-1 font-label-sm text-label-sm text-tertiary">
                          {t("history.originCycle", { n: row.originCycle })}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-space-md py-3 align-top">
                      <div className="font-semibold">{t(row.requesterNameKey)}</div>
                      <div className="text-on-surface-variant">
                        {t(row.requesterDeptKey)}
                      </div>
                    </td>
                    <td className="max-w-xs px-space-md py-3 align-top">
                      <div className="font-semibold">{t(row.titleKey)}</div>
                      <div className="line-clamp-2 text-on-surface-variant">
                        {t(row.detailKey)}
                      </div>
                    </td>
                    <td className="px-space-md py-3 align-top">
                      {staff ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                              staff.colorClass,
                            )}
                          >
                            {staff.initial}
                          </span>
                          <span>{t(staff.nameKey)}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-space-md py-3 align-top whitespace-nowrap">
                      {t(row.durationKey)}
                    </td>
                    <td className="px-space-md py-3 align-top">
                      <StatusChip status={row.status} label={t(`history.status.${row.status}`)} />
                    </td>
                    <td className="max-w-xs px-space-md py-3 align-top text-on-surface-variant">
                      {t(row.noteKey)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-sm bg-surface-container-low px-space-lg py-space-md sm:flex-row">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {t("history.showing", {
              from: filteredHistory.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, filteredHistory.length),
              total: filteredHistory.length,
            })}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg font-label-md text-label-md",
                  n === page
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container",
                )}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-primary px-4 py-3 font-label-md text-label-md text-on-primary shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
      <label className="font-label-md text-label-md font-semibold text-on-surface">
        {label}
      </label>
      {children}
    </div>
  );
}

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  unit,
  badge,
  badgeTone,
  children,
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: string;
  unit?: string;
  badge: string;
  badgeTone: "positive" | "neutral";
  children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="font-label-md text-label-md text-on-surface-variant">
          {label}
        </span>
        <span className={cn("rounded-lg p-space-xs", iconClass)}>
          <MaterialIcon className="text-[20px]" name={icon} />
        </span>
      </div>
      <p className="font-headline-md text-headline-md font-bold text-primary">
        {value}
        {unit ? (
          <span className="ml-1 font-body-sm text-body-sm font-normal text-on-surface-variant">
            {unit}
          </span>
        ) : null}
      </p>
      <span
        className={cn(
          "w-fit rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold",
          badgeTone === "positive"
            ? "bg-secondary-container/70 text-on-secondary-container"
            : "bg-surface-container-high text-on-surface-variant",
        )}
      >
        {badge}
      </span>
      {children}
    </article>
  );
}

function Chip({
  icon,
  children,
  tone = "primary",
}: {
  icon: string;
  children: React.ReactNode;
  tone?: "primary" | "secondary" | "success";
}) {
  const toneClass = {
    primary: "bg-primary-fixed/60 text-on-primary-fixed",
    secondary: "bg-secondary-container/70 text-on-secondary-container",
    success: "bg-secondary/10 text-secondary",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold",
        toneClass,
      )}
    >
      <MaterialIcon className="text-[16px]" name={icon} />
      {children}
    </span>
  );
}

function DeliveryTile({
  icon,
  iconClass,
  label,
  value,
  unit,
  footer,
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: number;
  unit: string;
  footer: string;
}) {
  return (
    <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low/50 p-space-md transition-colors hover:bg-surface-container-low">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconClass)}>
        <MaterialIcon className="text-[22px]" name={icon} />
      </div>
      <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
      <p className="font-headline-md text-headline-md font-bold text-on-surface">
        {value}{" "}
        <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">
          {unit}
        </span>
      </p>
      <p className="line-clamp-2 font-label-sm text-label-sm text-on-surface-variant">
        {footer}
      </p>
    </div>
  );
}

function CategoryDonut({
  slices,
  total,
  totalLabel,
}: {
  slices: Array<{ pct: number; strokeClass: string }>;
  total: number;
  totalLabel: string;
}) {
  let offset = 25;
  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          className="stroke-surface-container"
          strokeWidth="3.5"
        />
        {slices.map((slice, index) => {
          const circle = (
            <circle
              key={index}
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              className={slice.strokeClass}
              stroke="currentColor"
              strokeWidth="3.5"
              strokeDasharray={`${slice.pct} ${100 - slice.pct}`}
              strokeDashoffset={offset}
            />
          );
          offset -= slice.pct;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="font-headline-md text-headline-md font-bold text-primary">
          {total}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {totalLabel}
        </span>
      </div>
    </div>
  );
}

function StatusChip({ status, label }: { status: HistoryStatus; label: string }) {
  const tone = {
    closed: "bg-secondary-container text-on-secondary-container",
    in_development: "bg-primary-fixed text-on-primary-fixed",
    pending_claim: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  }[status];
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-bold",
        tone,
      )}
    >
      {label}
    </span>
  );
}
