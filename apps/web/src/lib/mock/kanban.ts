export type KanbanColumnId =
  | "backlog"
  | "in_progress"
  | "pending_user"
  | "resolved";

export type KanbanTicket = {
  id: string;
  titleKey: string;
  departmentKey: string;
  categoryKey: string;
  priority: "normal" | "urgent";
  column: KanbanColumnId;
  assigneeId?: string;
  ageLabelKey: string;
  progress?: number;
};

export type KanbanAssignee = {
  id: string;
  nameKey: string;
  specialtyKey: string;
  initial: string;
  colorClass: string;
  count: number;
};

export const kanbanAssignees: KanbanAssignee[] = [
  {
    id: "golf",
    nameKey: "assignees.golf",
    specialtyKey: "assignees.golfSpecialty",
    initial: "ก",
    colorClass: "bg-primary text-on-primary",
    count: 5,
  },
  {
    id: "bank",
    nameKey: "assignees.bank",
    specialtyKey: "assignees.bankSpecialty",
    initial: "บ",
    colorClass: "bg-secondary text-on-secondary",
    count: 6,
  },
  {
    id: "new",
    nameKey: "assignees.new",
    specialtyKey: "assignees.newSpecialty",
    initial: "น",
    colorClass: "bg-tertiary text-on-tertiary",
    count: 3,
  },
];

export const mockKanbanTickets: KanbanTicket[] = [
  {
    id: "TK-2024-106",
    titleKey: "tickets.t106",
    departmentKey: "departments.account",
    categoryKey: "categories.hardware",
    priority: "urgent",
    column: "backlog",
    ageLabelKey: "ages.minutes12",
  },
  {
    id: "TK-2024-107",
    titleKey: "tickets.t107",
    departmentKey: "departments.marketing",
    categoryKey: "categories.network",
    priority: "normal",
    column: "backlog",
    ageLabelKey: "ages.minutes35",
  },
  {
    id: "TK-2024-109",
    titleKey: "tickets.t109",
    departmentKey: "departments.hr",
    categoryKey: "categories.access",
    priority: "normal",
    column: "backlog",
    ageLabelKey: "ages.hour1",
  },
  {
    id: "TK-2024-111",
    titleKey: "tickets.t111",
    departmentKey: "departments.account",
    categoryKey: "categories.feature",
    priority: "normal",
    column: "in_progress",
    assigneeId: "bank",
    ageLabelKey: "ages.days2",
    progress: 65,
  },
  {
    id: "TK-2024-105",
    titleKey: "tickets.t105",
    departmentKey: "departments.operations",
    categoryKey: "categories.hardware",
    priority: "urgent",
    column: "in_progress",
    assigneeId: "golf",
    ageLabelKey: "ages.hours3",
    progress: 40,
  },
  {
    id: "TK-2024-108",
    titleKey: "tickets.t108",
    departmentKey: "departments.purchasing",
    categoryKey: "categories.software",
    priority: "normal",
    column: "in_progress",
    assigneeId: "new",
    ageLabelKey: "ages.hours5",
    progress: 80,
  },
  {
    id: "TK-2024-103",
    titleKey: "tickets.t103",
    departmentKey: "departments.account",
    categoryKey: "categories.software",
    priority: "normal",
    column: "pending_user",
    assigneeId: "bank",
    ageLabelKey: "ages.day1",
  },
  {
    id: "TK-2024-101",
    titleKey: "tickets.t101",
    departmentKey: "departments.marketing",
    categoryKey: "categories.network",
    priority: "normal",
    column: "pending_user",
    assigneeId: "golf",
    ageLabelKey: "ages.hours8",
  },
  {
    id: "TK-2024-098",
    titleKey: "tickets.t098",
    departmentKey: "departments.hr",
    categoryKey: "categories.access",
    priority: "normal",
    column: "resolved",
    assigneeId: "new",
    ageLabelKey: "ages.resolvedToday",
  },
  {
    id: "TK-2024-095",
    titleKey: "tickets.t095",
    departmentKey: "departments.operations",
    categoryKey: "categories.hardware",
    priority: "urgent",
    column: "resolved",
    assigneeId: "golf",
    ageLabelKey: "ages.resolvedYesterday",
  },
];

export type TimelineTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "success";

export type TicketTimelineItem = {
  timeKey: string;
  titleKey: string;
  bodyKey?: string;
  noteKey?: string;
  noteTone?: "default" | "error";
  tone: TimelineTone;
};

export type TicketCollaborator = {
  assigneeId: string;
  role: "lead" | "collaborator";
};

export type TicketDetail = {
  requesterKey: string;
  extension: string;
  statusKey: string;
  descriptionKey: string;
  reopenedCount?: number;
  collaborators: TicketCollaborator[];
  timeline: TicketTimelineItem[];
};

const defaultDetail = (ticket: KanbanTicket): TicketDetail => ({
  requesterKey: "detail.defaults.requester",
  extension: "3300",
  statusKey: `detail.status.${ticket.column}`,
  descriptionKey: "detail.defaults.description",
  collaborators: ticket.assigneeId
    ? [{ assigneeId: ticket.assigneeId, role: "lead" }]
    : [],
  timeline: [
    {
      timeKey: "detail.defaults.timeline.opened.time",
      titleKey: "detail.defaults.timeline.opened.title",
      bodyKey: "detail.defaults.timeline.opened.body",
      tone: "neutral",
    },
    ...(ticket.assigneeId
      ? [
          {
            timeKey: "detail.defaults.timeline.claimed.time",
            titleKey: "detail.defaults.timeline.claimed.title",
            bodyKey: "detail.defaults.timeline.claimed.body",
            tone: "secondary" as const,
          },
        ]
      : []),
  ],
});

/** Rich mock for pending-user showcase (matches design drawer). */
const richDetails: Partial<Record<string, TicketDetail>> = {
  "TK-2024-103": {
    requesterKey: "detail.t103.requester",
    extension: "3312",
    statusKey: "detail.status.pending_user",
    descriptionKey: "detail.t103.description",
    reopenedCount: 1,
    collaborators: [
      { assigneeId: "bank", role: "lead" },
      { assigneeId: "new", role: "collaborator" },
    ],
    timeline: [
      {
        timeKey: "detail.t103.timeline.1.time",
        titleKey: "detail.t103.timeline.1.title",
        bodyKey: "detail.t103.timeline.1.body",
        tone: "neutral",
      },
      {
        timeKey: "detail.t103.timeline.2.time",
        titleKey: "detail.t103.timeline.2.title",
        bodyKey: "detail.t103.timeline.2.body",
        tone: "secondary",
      },
      {
        timeKey: "detail.t103.timeline.3.time",
        titleKey: "detail.t103.timeline.3.title",
        noteKey: "detail.t103.timeline.3.note",
        tone: "primary",
      },
      {
        timeKey: "detail.t103.timeline.4.time",
        titleKey: "detail.t103.timeline.4.title",
        bodyKey: "detail.t103.timeline.4.body",
        tone: "tertiary",
      },
      {
        timeKey: "detail.t103.timeline.5.time",
        titleKey: "detail.t103.timeline.5.title",
        bodyKey: "detail.t103.timeline.5.body",
        tone: "neutral",
      },
      {
        timeKey: "detail.t103.timeline.6.time",
        titleKey: "detail.t103.timeline.6.title",
        noteKey: "detail.t103.timeline.6.note",
        noteTone: "error",
        tone: "error",
      },
      {
        timeKey: "detail.t103.timeline.7.time",
        titleKey: "detail.t103.timeline.7.title",
        bodyKey: "detail.t103.timeline.7.body",
        tone: "success",
      },
    ],
  },
  "TK-2024-111": {
    requesterKey: "detail.t111.requester",
    extension: "3401",
    statusKey: "detail.status.in_progress",
    descriptionKey: "detail.t111.description",
    collaborators: [
      { assigneeId: "bank", role: "lead" },
      { assigneeId: "new", role: "collaborator" },
    ],
    timeline: [
      {
        timeKey: "detail.t111.timeline.1.time",
        titleKey: "detail.t111.timeline.1.title",
        bodyKey: "detail.t111.timeline.1.body",
        tone: "neutral",
      },
      {
        timeKey: "detail.t111.timeline.2.time",
        titleKey: "detail.t111.timeline.2.title",
        bodyKey: "detail.t111.timeline.2.body",
        tone: "secondary",
      },
      {
        timeKey: "detail.t111.timeline.3.time",
        titleKey: "detail.t111.timeline.3.title",
        bodyKey: "detail.t111.timeline.3.body",
        tone: "primary",
      },
    ],
  },
};

export function getTicketDetail(ticket: KanbanTicket): TicketDetail {
  return richDetails[ticket.id] ?? defaultDetail(ticket);
}

export const quickLogDepartments = [
  "account",
  "marketing",
  "hr",
  "purchasing",
  "operations",
] as const;

export const quickLogIssuePresets = [
  "frozenApp",
  "printerJam",
  "cableLoose",
  "wrongKeyboardLang",
  "wrongProgram",
] as const;

export const quickLogResolvePresets = [
  "replug",
  "restart",
  "clearPaper",
  "resetPass",
  "guideUser",
] as const;
