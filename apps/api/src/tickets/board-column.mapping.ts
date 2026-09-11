export type BoardColumnId =
  | "backlog"
  | "in_progress"
  | "pending_user"
  | "resolved";

export type BoardTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "AWAITING_USER_TEST"
  | "RESOLVED"
  | "CLOSED";

export function mapTicketToBoardColumn(input: {
  status: BoardTicketStatus | string;
  hasLead: boolean;
}): BoardColumnId {
  if (input.status === "RESOLVED" || input.status === "CLOSED") {
    return "resolved";
  }
  if (
    input.status === "AWAITING_USER_TEST" ||
    input.status === "PENDING_APPROVAL"
  ) {
    return "pending_user";
  }
  if (input.status === "IN_PROGRESS" || input.hasLead) {
    return "in_progress";
  }
  return "backlog";
}

export function ticketHasLead(
  assignees: Array<{ role?: string | null }> | undefined,
): boolean {
  return (assignees ?? []).some((assignee) => assignee.role === "LEAD");
}
