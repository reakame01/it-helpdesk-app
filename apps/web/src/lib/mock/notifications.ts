export type NotificationType =
  | "newTicket"
  | "reopened"
  | "pendingConfirm"
  | "slaRisk"
  | "assigned";

export type MockNotification = {
  id: string;
  type: NotificationType;
  unread: boolean;
  ticketId?: string;
  /** i18n key under notifications.items.* */
  titleKey: string;
  bodyKey: string;
  timeKey: string;
  href: string;
};

export const mockNotifications: MockNotification[] = [
  {
    id: "n1",
    type: "newTicket",
    unread: true,
    ticketId: "TK-2148",
    titleKey: "newTicketTitle",
    bodyKey: "newTicketBody",
    timeKey: "minutes5",
    href: "/it",
  },
  {
    id: "n2",
    type: "reopened",
    unread: true,
    ticketId: "TK-2139",
    titleKey: "reopenedTitle",
    bodyKey: "reopenedBody",
    timeKey: "minutes28",
    href: "/it",
  },
  {
    id: "n3",
    type: "slaRisk",
    unread: true,
    ticketId: "TK-2122",
    titleKey: "slaRiskTitle",
    bodyKey: "slaRiskBody",
    timeKey: "hour1",
    href: "/it",
  },
  {
    id: "n4",
    type: "assigned",
    unread: false,
    ticketId: "TK-2110",
    titleKey: "assignedTitle",
    bodyKey: "assignedBody",
    timeKey: "hours3",
    href: "/it",
  },
  {
    id: "n5",
    type: "pendingConfirm",
    unread: false,
    ticketId: "TK-2098",
    titleKey: "pendingConfirmTitle",
    bodyKey: "pendingConfirmBody",
    timeKey: "yesterday",
    href: "/it",
  },
];

export const notificationTypeIcon: Record<NotificationType, string> = {
  newTicket: "confirmation_number",
  reopened: "replay",
  pendingConfirm: "mark_email_read",
  slaRisk: "schedule",
  assigned: "person_add",
};
