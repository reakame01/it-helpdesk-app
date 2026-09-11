export enum UserRole {
  USER = "USER",
  IT_STAFF = "IT_STAFF",
  SUPERVISOR = "SUPERVISOR",
  IT_MANAGER = "IT_MANAGER",
}

export enum TicketCategory {
  HARDWARE = "HARDWARE",
  NETWORK = "NETWORK",
  SOFTWARE_BUG = "SOFTWARE_BUG",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  ACCESS = "ACCESS",
  OTHER = "OTHER",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  AWAITING_USER_TEST = "AWAITING_USER_TEST",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum AssigneeRole {
  LEAD = "LEAD",
  COLLABORATOR = "COLLABORATOR",
}

export type BoardColumnId =
  | "backlog"
  | "in_progress"
  | "pending_user"
  | "resolved";

export enum ConfirmTokenStage {
  AWAITING_USER_TEST = "AWAITING_USER_TEST",
  RESOLVED = "RESOLVED",
}

export type ConfirmTokenAction =
  | "approve-and-close"
  | "report-issue"
  | "reopen";

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum TicketType {
  STANDARD = "STANDARD",
  QUICK_TICKET = "QUICK_TICKET",
}
