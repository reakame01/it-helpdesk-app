export enum UserRole {
  USER = "USER",
  IT_STAFF = "IT_STAFF",
  IT_LEAD = "IT_LEAD",
  GM = "GM",
}

export enum TicketCategory {
  HARDWARE = "HARDWARE",
  NETWORK = "NETWORK",
  SOFTWARE_BUG = "SOFTWARE_BUG",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  OTHER = "OTHER",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

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
