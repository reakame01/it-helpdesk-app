export type WorkCycleId = "current" | "previous";

export type ReportRangeMode = "cycle" | "month" | "year";

export type DashboardFilters = {
  rangeMode: ReportRangeMode;
  workCycleId: WorkCycleId;
  monthId: string;
  yearId: string;
  departmentId: string;
  assigneeId: string;
};

export type HistoryStatus = "closed" | "in_development" | "pending_claim";

export type CycleBreakdownRow = {
  cycleNumber: number;
  dateRangeKey: string;
  resolved: number;
  total: number;
  successRate: number;
  carryoverOut: number;
  slaPassPct: number;
};

export type TicketHistoryRow = {
  id: string;
  dateKey: string;
  timeKey: string;
  ticketCode: string;
  requesterNameKey: string;
  requesterDeptKey: string;
  titleKey: string;
  detailKey: string;
  assigneeId: string;
  durationKey: string;
  status: HistoryStatus;
  noteKey: string;
  highlight?: "dev" | "pending";
  originCycle?: number;
};

export type DashboardSnapshot = {
  kpis: {
    resolved: number;
    total: number;
    successRate: number;
    trendPct: number;
    portalResolved: number;
    quickTicketResolved: number;
    firstResponseMinutes: number;
    resolutionHours: number;
    csat: number;
    csatRespondents: number;
    csatPct: number;
  };
  delivery: {
    cycleNumber: number;
    deliveryPct: number;
    onSchedule: boolean;
    delivered: number;
    inProgress: number;
    inProgressTitles: string[];
    uat: number;
    carryover: number;
  };
  staff: Array<{
    id: string;
    nameKey: string;
    roleKey: string;
    ext: string;
    initial: string;
    colorClass: string;
    csat: number;
    scopeKey: string;
    resolved: number;
    successRate: number;
    workloadPct: number;
    barClass: string;
    footerLeftKey: string;
    footerRightKey: string;
  }>;
  categories: Array<{
    id: string;
    labelKey: string;
    count: number;
    pct: number;
    colorClass: string;
    strokeClass: string;
  }>;
  categoryTotal: number;
  insightKey: string;
  departments: Array<{
    id: string;
    labelKey: string;
    count: number;
    pct: number;
    barClass: string;
  }>;
  slaPassPct: number;
  slaGrade: string;
  history: TicketHistoryRow[];
  /** Present for month/year aggregate views — work cycles rolled into the range. */
  cycleBreakdown?: CycleBreakdownRow[];
  rangeSummaryKey?: string;
};

const staffBase = [
  {
    id: "golf",
    nameKey: "staff.golf",
    roleKey: "staff.golfRole",
    ext: "101",
    initial: "ก",
    colorClass: "bg-primary text-on-primary",
    barClass: "bg-primary",
  },
  {
    id: "bank",
    nameKey: "staff.bank",
    roleKey: "staff.bankRole",
    ext: "102",
    initial: "บ",
    colorClass: "bg-secondary text-on-secondary",
    barClass: "bg-secondary",
  },
  {
    id: "new",
    nameKey: "staff.new",
    roleKey: "staff.newRole",
    ext: "103",
    initial: "น",
    colorClass: "bg-tertiary text-on-tertiary",
    barClass: "bg-surface-tint",
  },
] as const;

const currentSnapshot: DashboardSnapshot = {
  kpis: {
    resolved: 142,
    total: 144,
    successRate: 98.6,
    trendPct: 12,
    portalResolved: 128,
    quickTicketResolved: 14,
    firstResponseMinutes: 18,
    resolutionHours: 1.75,
    csat: 4.8,
    csatRespondents: 138,
    csatPct: 96,
  },
  delivery: {
    cycleNumber: 12,
    deliveryPct: 92,
    onSchedule: true,
    delivered: 12,
    inProgress: 3,
    inProgressTitles: [
      "delivery.inProgress1",
      "delivery.inProgress2",
      "delivery.inProgress3",
    ],
    uat: 2,
    carryover: 5,
  },
  staff: [
    {
      ...staffBase[0],
      csat: 4.9,
      scopeKey: "staff.golfScope",
      resolved: 54,
      successRate: 99,
      workloadPct: 38,
      footerLeftKey: "staff.golfFooterLeft",
      footerRightKey: "staff.golfFooterRight",
    },
    {
      ...staffBase[1],
      csat: 4.8,
      scopeKey: "staff.bankScope",
      resolved: 48,
      successRate: 98,
      workloadPct: 34,
      footerLeftKey: "staff.bankFooterLeft",
      footerRightKey: "staff.bankFooterRight",
    },
    {
      ...staffBase[2],
      csat: 4.7,
      scopeKey: "staff.newScope",
      resolved: 40,
      successRate: 98,
      workloadPct: 28,
      footerLeftKey: "staff.newFooterLeft",
      footerRightKey: "staff.newFooterRight",
    },
  ],
  categories: [
    {
      id: "software",
      labelKey: "categories.software",
      count: 52,
      pct: 36,
      colorClass: "bg-primary",
      strokeClass: "text-primary",
    },
    {
      id: "hardware",
      labelKey: "categories.hardware",
      count: 40,
      pct: 28,
      colorClass: "bg-secondary",
      strokeClass: "text-secondary",
    },
    {
      id: "access",
      labelKey: "categories.access",
      count: 24,
      pct: 17,
      colorClass: "bg-tertiary",
      strokeClass: "text-tertiary",
    },
    {
      id: "network",
      labelKey: "categories.network",
      count: 16,
      pct: 11,
      colorClass: "bg-primary-container",
      strokeClass: "text-primary-container",
    },
    {
      id: "feature",
      labelKey: "categories.feature",
      count: 12,
      pct: 8,
      colorClass: "bg-surface-tint",
      strokeClass: "text-surface-tint",
    },
  ],
  categoryTotal: 144,
  insightKey: "insight.current",
  departments: [
    {
      id: "account",
      labelKey: "departments.account",
      count: 42,
      pct: 90,
      barClass: "bg-primary",
    },
    {
      id: "marketing",
      labelKey: "departments.marketing",
      count: 31,
      pct: 68,
      barClass: "bg-secondary",
    },
    {
      id: "purchasing",
      labelKey: "departments.purchasing",
      count: 28,
      pct: 60,
      barClass: "bg-tertiary",
    },
    {
      id: "hr",
      labelKey: "departments.hr",
      count: 22,
      pct: 48,
      barClass: "bg-primary-container",
    },
    {
      id: "operations",
      labelKey: "departments.operations",
      count: 21,
      pct: 45,
      barClass: "bg-surface-tint",
    },
  ],
  slaPassPct: 98.6,
  slaGrade: "A+",
  history: [
    {
      id: "h1",
      dateKey: "history.rows.h1.date",
      timeKey: "history.rows.h1.time",
      ticketCode: "TK-2024-142",
      requesterNameKey: "history.rows.h1.requester",
      requesterDeptKey: "departments.account",
      titleKey: "history.rows.h1.title",
      detailKey: "history.rows.h1.detail",
      assigneeId: "bank",
      durationKey: "history.rows.h1.duration",
      status: "closed",
      noteKey: "history.rows.h1.note",
    },
    {
      id: "h2",
      dateKey: "history.rows.h2.date",
      timeKey: "history.rows.h2.time",
      ticketCode: "TK-2024-139",
      requesterNameKey: "history.rows.h2.requester",
      requesterDeptKey: "departments.marketing",
      titleKey: "history.rows.h2.title",
      detailKey: "history.rows.h2.detail",
      assigneeId: "golf",
      durationKey: "history.rows.h2.duration",
      status: "closed",
      noteKey: "history.rows.h2.note",
    },
    {
      id: "h3",
      dateKey: "history.rows.h3.date",
      timeKey: "history.rows.h3.time",
      ticketCode: "TK-2024-111",
      requesterNameKey: "history.rows.h3.requester",
      requesterDeptKey: "departments.account",
      titleKey: "history.rows.h3.title",
      detailKey: "history.rows.h3.detail",
      assigneeId: "new",
      durationKey: "history.rows.h3.duration",
      status: "in_development",
      noteKey: "history.rows.h3.note",
      highlight: "dev",
      originCycle: 11,
    },
    {
      id: "h4",
      dateKey: "history.rows.h4.date",
      timeKey: "history.rows.h4.time",
      ticketCode: "TK-2024-128",
      requesterNameKey: "history.rows.h4.requester",
      requesterDeptKey: "departments.hr",
      titleKey: "history.rows.h4.title",
      detailKey: "history.rows.h4.detail",
      assigneeId: "golf",
      durationKey: "history.rows.h4.duration",
      status: "closed",
      noteKey: "history.rows.h4.note",
    },
    {
      id: "h5",
      dateKey: "history.rows.h5.date",
      timeKey: "history.rows.h5.time",
      ticketCode: "TK-2024-120",
      requesterNameKey: "history.rows.h5.requester",
      requesterDeptKey: "departments.purchasing",
      titleKey: "history.rows.h5.title",
      detailKey: "history.rows.h5.detail",
      assigneeId: "bank",
      durationKey: "history.rows.h5.duration",
      status: "pending_claim",
      noteKey: "history.rows.h5.note",
      highlight: "pending",
    },
    {
      id: "h6",
      dateKey: "history.rows.h6.date",
      timeKey: "history.rows.h6.time",
      ticketCode: "TK-2024-115",
      requesterNameKey: "history.rows.h6.requester",
      requesterDeptKey: "departments.operations",
      titleKey: "history.rows.h6.title",
      detailKey: "history.rows.h6.detail",
      assigneeId: "new",
      durationKey: "history.rows.h6.duration",
      status: "closed",
      noteKey: "history.rows.h6.note",
      originCycle: 10,
    },
  ],
};

const previousSnapshot: DashboardSnapshot = {
  ...currentSnapshot,
  kpis: {
    ...currentSnapshot.kpis,
    resolved: 126,
    total: 130,
    successRate: 96.9,
    trendPct: 4,
    portalResolved: 112,
    quickTicketResolved: 14,
    firstResponseMinutes: 22,
    resolutionHours: 2.1,
    csat: 4.6,
    csatRespondents: 118,
    csatPct: 92,
  },
  delivery: {
    ...currentSnapshot.delivery,
    cycleNumber: 11,
    deliveryPct: 88,
    delivered: 10,
    inProgress: 4,
    uat: 1,
    carryover: 7,
  },
  slaPassPct: 96.9,
  slaGrade: "A",
};

export const dashboardDepartments = [
  "account",
  "marketing",
  "purchasing",
  "hr",
  "operations",
] as const;

export const dashboardAssignees = ["golf", "bank", "new"] as const;

export const dashboardMonths = ["2024-12", "2024-11", "2024-10"] as const;

export const dashboardYears = ["2024", "2023"] as const;

const monthDecBreakdown: CycleBreakdownRow[] = [
  {
    cycleNumber: 12,
    dateRangeKey: "range.cycleRanges.c12",
    resolved: 142,
    total: 144,
    successRate: 98.6,
    carryoverOut: 5,
    slaPassPct: 98.6,
  },
  {
    cycleNumber: 11,
    dateRangeKey: "range.cycleRanges.c11",
    resolved: 126,
    total: 130,
    successRate: 96.9,
    carryoverOut: 7,
    slaPassPct: 96.9,
  },
];

const year2024Breakdown: CycleBreakdownRow[] = [
  {
    cycleNumber: 12,
    dateRangeKey: "range.cycleRanges.c12",
    resolved: 142,
    total: 144,
    successRate: 98.6,
    carryoverOut: 5,
    slaPassPct: 98.6,
  },
  {
    cycleNumber: 11,
    dateRangeKey: "range.cycleRanges.c11",
    resolved: 126,
    total: 130,
    successRate: 96.9,
    carryoverOut: 7,
    slaPassPct: 96.9,
  },
  {
    cycleNumber: 10,
    dateRangeKey: "range.cycleRanges.c10",
    resolved: 118,
    total: 124,
    successRate: 95.2,
    carryoverOut: 6,
    slaPassPct: 95.2,
  },
  {
    cycleNumber: 9,
    dateRangeKey: "range.cycleRanges.c9",
    resolved: 131,
    total: 135,
    successRate: 97.0,
    carryoverOut: 4,
    slaPassPct: 97.0,
  },
  {
    cycleNumber: 8,
    dateRangeKey: "range.cycleRanges.c8",
    resolved: 109,
    total: 116,
    successRate: 94.0,
    carryoverOut: 8,
    slaPassPct: 94.0,
  },
  {
    cycleNumber: 7,
    dateRangeKey: "range.cycleRanges.c7",
    resolved: 121,
    total: 125,
    successRate: 96.8,
    carryoverOut: 5,
    slaPassPct: 96.8,
  },
];

function scaleStaff(
  base: DashboardSnapshot["staff"],
  multiplier: number,
): DashboardSnapshot["staff"] {
  return base.map((person) => ({
    ...person,
    resolved: Math.round(person.resolved * multiplier),
  }));
}

function aggregateFromBreakdown(
  breakdown: CycleBreakdownRow[],
  base: DashboardSnapshot,
  rangeSummaryKey: string,
  multiplier: number,
): DashboardSnapshot {
  const resolved = breakdown.reduce((sum, row) => sum + row.resolved, 0);
  const total = breakdown.reduce((sum, row) => sum + row.total, 0);
  const carryover = breakdown.reduce((sum, row) => sum + row.carryoverOut, 0);
  const successRate =
    total === 0 ? 0 : Math.round((resolved / total) * 1000) / 10;
  const slaPassPct =
    Math.round(
      (breakdown.reduce((sum, row) => sum + row.slaPassPct, 0) /
        breakdown.length) *
        10,
    ) / 10;

  return {
    ...base,
    kpis: {
      ...base.kpis,
      resolved,
      total,
      successRate,
      trendPct: rangeSummaryKey.includes("year") ? 8 : 6,
      portalResolved: Math.round(resolved * 0.9),
      quickTicketResolved: resolved - Math.round(resolved * 0.9),
      firstResponseMinutes: rangeSummaryKey.includes("year") ? 20 : 19,
      resolutionHours: rangeSummaryKey.includes("year") ? 1.9 : 1.85,
      csat: rangeSummaryKey.includes("year") ? 4.7 : 4.75,
      csatRespondents: Math.round(base.kpis.csatRespondents * multiplier),
      csatPct: rangeSummaryKey.includes("year") ? 94 : 95,
    },
    delivery: {
      ...base.delivery,
      cycleNumber: breakdown[0]?.cycleNumber ?? base.delivery.cycleNumber,
      deliveryPct: Math.round(successRate),
      delivered: Math.round(base.delivery.delivered * multiplier),
      inProgress: base.delivery.inProgress,
      uat: base.delivery.uat,
      carryover,
    },
    staff: scaleStaff(base.staff, multiplier),
    categoryTotal: total,
    categories: base.categories.map((slice) => ({
      ...slice,
      count: Math.round(slice.count * multiplier),
    })),
    departments: base.departments.map((dept) => ({
      ...dept,
      count: Math.round(dept.count * multiplier),
    })),
    slaPassPct,
    slaGrade: slaPassPct >= 98 ? "A+" : slaPassPct >= 95 ? "A" : "B+",
    insightKey: rangeSummaryKey.includes("year")
      ? "insight.year"
      : "insight.month",
    cycleBreakdown: breakdown,
    rangeSummaryKey,
  };
}

export function getDashboardSnapshot(
  filters: Pick<DashboardFilters, "rangeMode" | "workCycleId" | "monthId" | "yearId">,
): DashboardSnapshot {
  if (filters.rangeMode === "month") {
    if (filters.monthId === "2024-11") {
      return aggregateFromBreakdown(
        [
          {
            cycleNumber: 10,
            dateRangeKey: "range.cycleRanges.c10",
            resolved: 118,
            total: 124,
            successRate: 95.2,
            carryoverOut: 6,
            slaPassPct: 95.2,
          },
          {
            cycleNumber: 9,
            dateRangeKey: "range.cycleRanges.c9",
            resolved: 131,
            total: 135,
            successRate: 97.0,
            carryoverOut: 4,
            slaPassPct: 97.0,
          },
        ],
        previousSnapshot,
        "range.summary.monthNov",
        1.7,
      );
    }
    if (filters.monthId === "2024-10") {
      return aggregateFromBreakdown(
        [
          {
            cycleNumber: 8,
            dateRangeKey: "range.cycleRanges.c8",
            resolved: 109,
            total: 116,
            successRate: 94.0,
            carryoverOut: 8,
            slaPassPct: 94.0,
          },
          {
            cycleNumber: 7,
            dateRangeKey: "range.cycleRanges.c7",
            resolved: 121,
            total: 125,
            successRate: 96.8,
            carryoverOut: 5,
            slaPassPct: 96.8,
          },
        ],
        previousSnapshot,
        "range.summary.monthOct",
        1.6,
      );
    }
    return aggregateFromBreakdown(
      monthDecBreakdown,
      currentSnapshot,
      "range.summary.monthDec",
      1.85,
    );
  }

  if (filters.rangeMode === "year") {
    if (filters.yearId === "2023") {
      return aggregateFromBreakdown(
        year2024Breakdown.map((row) => ({
          ...row,
          cycleNumber: row.cycleNumber - 6,
          resolved: Math.round(row.resolved * 0.85),
          total: Math.round(row.total * 0.88),
        })),
        previousSnapshot,
        "range.summary.year2023",
        8,
      );
    }
    return aggregateFromBreakdown(
      year2024Breakdown,
      currentSnapshot,
      "range.summary.year2024",
      10,
    );
  }

  return filters.workCycleId === "previous" ? previousSnapshot : currentSnapshot;
}

export function getDefaultDashboardFilters(): DashboardFilters {
  return {
    rangeMode: "cycle",
    workCycleId: "current",
    monthId: "2024-12",
    yearId: "2024",
    departmentId: "all",
    assigneeId: "all",
  };
}

export function filterHistoryRows(
  rows: TicketHistoryRow[],
  filters: Pick<DashboardFilters, "departmentId" | "assigneeId">,
): TicketHistoryRow[] {
  return rows.filter((row) => {
    if (filters.departmentId !== "all") {
      const deptId = row.requesterDeptKey.replace("departments.", "");
      if (deptId !== filters.departmentId) return false;
    }
    if (filters.assigneeId !== "all" && row.assigneeId !== filters.assigneeId) {
      return false;
    }
    return true;
  });
}
