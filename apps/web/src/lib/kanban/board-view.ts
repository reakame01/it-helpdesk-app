import type { BoardAssigneeDto, BoardTicketDto, TicketPriority } from "@helpdesk/types";

export const ASSIGNEE_SWATCHES = [
  "bg-primary text-on-primary",
  "bg-secondary text-on-secondary",
  "bg-tertiary text-on-tertiary",
  "bg-primary-container text-on-primary-container",
] as const;

export type BoardCategoryFilter =
  | "all"
  | "hardware"
  | "software"
  | "network"
  | "access"
  | "feature"
  | "other";

export function categoryFilterKey(categoryCode: string): BoardCategoryFilter {
  switch (categoryCode) {
    case "hardware":
      return "hardware";
    case "network":
      return "network";
    case "software":
    case "software_bug":
      return "software";
    case "access":
      return "access";
    case "feature_request":
      return "feature";
    default:
      return "other";
  }
}

export function boardPriority(priority: TicketPriority): "normal" | "urgent" {
  return priority === "HIGH" || priority === "CRITICAL" ? "urgent" : "normal";
}

export function assigneeInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1) : "?";
}

export function assigneeSwatch(userId: string): string {
  let hash = 0;
  for (const char of userId) {
    hash = (hash + char.charCodeAt(0)) % ASSIGNEE_SWATCHES.length;
  }
  return ASSIGNEE_SWATCHES[hash] ?? ASSIGNEE_SWATCHES[0];
}

export function uniqueAssignees(tickets: BoardTicketDto[]): BoardAssigneeDto[] {
  const byId = new Map<string, BoardAssigneeDto>();
  for (const ticket of tickets) {
    if (ticket.lead) byId.set(ticket.lead.userId, ticket.lead);
    for (const collaborator of ticket.collaborators) {
      if (!byId.has(collaborator.userId)) {
        byId.set(collaborator.userId, collaborator);
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function formatTicketAge(isoDate: string, locale: string): string {
  const created = new Date(isoDate).getTime();
  if (Number.isNaN(created)) return "";
  const deltaSec = Math.max(0, Math.round((Date.now() - created) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale.startsWith("th") ? "th" : "en", {
    numeric: "auto",
  });
  if (deltaSec < 60) return rtf.format(-deltaSec, "second");
  const minutes = Math.round(deltaSec / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}

export function isDevelopmentTicket(ticket: Pick<BoardTicketDto, "category" | "categoryCode">): boolean {
  return (
    ticket.category === "FEATURE_REQUEST" ||
    ticket.categoryCode === "feature_request"
  );
}

export function isQuickTicket(ticket: Pick<BoardTicketDto, "type">): boolean {
  return ticket.type === "QUICK_TICKET";
}

export function showsDevelopmentProgress(ticket: BoardTicketDto): boolean {
  return ticket.column === "in_progress" && isDevelopmentTicket(ticket);
}

export type ParsedProgressUpdate = {
  percent: number | null;
  summary: string;
};

export function parseProgressWorklog(note: string): ParsedProgressUpdate {
  const match = note.match(/^(?:Development )?Progress (\d{1,3})%:\s*([\s\S]*)$/);
  if (!match) {
    return { percent: null, summary: note.trim() };
  }
  const percent = Number(match[1]);
  return {
    percent: Number.isInteger(percent) ? percent : null,
    summary: (match[2] ?? "").trim(),
  };
}

