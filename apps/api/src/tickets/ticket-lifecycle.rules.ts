export type ClaimDecision = "ok" | "unauthorized" | "already_has_lead";
export type ConfirmTokenStage = "AWAITING_USER_TEST" | "RESOLVED";
export type ActorKind = "ASSIGNEE" | "REQUESTER_TOKEN";
export type ConfirmTokenAction = "approve-and-close" | "report-issue" | "reopen";

const IT_ROLES = new Set(["IT_STAFF", "SUPERVISOR", "IT_MANAGER"]);

export function isItSessionRole(role: string | undefined): boolean {
  return role !== undefined && IT_ROLES.has(role);
}

export function isAssigneeOf(
  assigneeUserIds: string[],
  actorUserId: string | undefined,
): boolean {
  return Boolean(actorUserId && assigneeUserIds.includes(actorUserId));
}

export function decideClaim(input: {
  actorRole: string | undefined;
  hasLead: boolean;
}): ClaimDecision {
  if (!isItSessionRole(input.actorRole)) {
    return "unauthorized";
  }
  if (input.hasLead) {
    return "already_has_lead";
  }
  return "ok";
}

export function isLeadOf(
  assignees: Array<{ userId: string; role?: string | null }>,
  actorUserId: string | undefined,
): boolean {
  return Boolean(
    actorUserId &&
      assignees.some((row) => row.userId === actorUserId && row.role === "LEAD"),
  );
}

export function decideAddCollaborator(input: {
  actorRole: string | undefined;
  hasLead: boolean;
  alreadyAssigned: boolean;
  isLead: boolean;
}): "ok" | "unauthorized" | "no_lead" | "already_assigned" {
  if (!isItSessionRole(input.actorRole)) {
    return "unauthorized";
  }
  if (!input.hasLead) {
    return "no_lead";
  }
  if (!input.isLead) {
    return "unauthorized";
  }
  if (input.alreadyAssigned) {
    return "already_assigned";
  }
  return "ok";
}

export function decideRemoveCollaborator(input: {
  isLead: boolean;
  targetIsCollaborator: boolean;
}): "ok" | "unauthorized" | "wrong_kind" {
  if (!input.isLead) return "unauthorized";
  if (!input.targetIsCollaborator) return "wrong_kind";
  return "ok";
}

export function decideWithdraw(input: {
  status: string;
  isAssignee: boolean;
}): "ok" | "unauthorized" | "wrong_status" {
  if (!input.isAssignee) return "unauthorized";
  if (input.status !== "IN_PROGRESS") return "wrong_status";
  return "ok";
}

export function nextLeadUserIdAfterWithdraw(
  assignees: Array<{
    userId: string;
    role?: string | null;
    assignedAt: Date | string;
  }>,
  withdrawingUserId: string,
): string | null {
  const remaining = assignees.filter((row) => row.userId !== withdrawingUserId);
  if (remaining.length === 0) return null;
  const stillLead = remaining.find((row) => row.role === "LEAD");
  if (stillLead) return stillLead.userId;
  const byInvite = [...remaining].sort((a, b) => {
    const delta =
      new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
    if (delta !== 0) return delta;
    return a.userId.localeCompare(b.userId);
  });
  return byInvite[0]?.userId ?? null;
}

export function decideSendForUserTest(input: {
  status: string;
  isAssignee: boolean;
}): "ok" | "unauthorized" | "wrong_status" {
  if (!input.isAssignee) return "unauthorized";
  if (input.status !== "IN_PROGRESS") return "wrong_status";
  return "ok";
}

export function decideApproveAndClose(input: {
  status: string;
  isAssignee: boolean;
  tokenValidForAwaiting: boolean;
}):
  | { ok: true; actorKind: ActorKind }
  | { ok: false; reason: "wrong_status" | "unauthorized" } {
  if (input.status !== "AWAITING_USER_TEST") {
    return { ok: false, reason: "wrong_status" };
  }
  if (input.isAssignee) return { ok: true, actorKind: "ASSIGNEE" };
  if (input.tokenValidForAwaiting) {
    return { ok: true, actorKind: "REQUESTER_TOKEN" };
  }
  return { ok: false, reason: "unauthorized" };
}

export function decideReportIssue(input: {
  status: string;
  tokenValidForAwaiting: boolean;
  reason: string;
}): "ok" | "wrong_status" | "unauthorized" | "invalid_reason" {
  if (input.status !== "AWAITING_USER_TEST") return "wrong_status";
  if (!input.tokenValidForAwaiting) return "unauthorized";
  if (!input.reason.trim()) return "invalid_reason";
  return "ok";
}

export function decideReopen(input: {
  status: string;
  isAssignee: boolean;
  tokenValidForResolved: boolean;
  reason: string;
}):
  | { ok: true; actorKind: ActorKind }
  | { ok: false; reason: "wrong_status" | "unauthorized" | "invalid_reason" } {
  if (input.status !== "RESOLVED") return { ok: false, reason: "wrong_status" };
  if (!input.reason.trim()) return { ok: false, reason: "invalid_reason" };
  if (input.isAssignee) return { ok: true, actorKind: "ASSIGNEE" };
  if (input.tokenValidForResolved) {
    return { ok: true, actorKind: "REQUESTER_TOKEN" };
  }
  return { ok: false, reason: "unauthorized" };
}

export function decideResend(input: {
  status: string;
  isAssignee: boolean;
}): "ok" | "unauthorized" | "wrong_status" {
  if (!input.isAssignee) return "unauthorized";
  if (input.status !== "AWAITING_USER_TEST" && input.status !== "RESOLVED") {
    return "wrong_status";
  }
  return "ok";
}

const PROGRESS_WORKLOG_NOTE =
  /^(?:Development )?Progress (\d{1,3})%:\s*([\s\S]*)$/;

export function parseProgressWorklogNote(
  note: string,
): { percent: number; summary: string } | null {
  const match = note.match(PROGRESS_WORKLOG_NOTE);
  if (!match) return null;
  const percent = Number(match[1]);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    return null;
  }
  return { percent, summary: (match[2] ?? "").trim() };
}

export function isProgressWorklogNote(note: string): boolean {
  return parseProgressWorklogNote(note) !== null;
}

export function formatProgressWorklogNote(percent: number, note: string): string {
  return `Development Progress ${percent}%: ${note.trim()}`;
}

export function latestProgressPercent(notesNewestFirst: string[]): number {
  for (const note of notesNewestFirst) {
    const parsed = parseProgressWorklogNote(note);
    if (parsed) return parsed.percent;
  }
  return 0;
}

export function decideProgressUpdate(input: {
  category: string;
  isAssignee: boolean;
  percent: number;
  note: string;
}):
  | "ok"
  | "unauthorized"
  | "wrong_category"
  | "invalid_percent"
  | "invalid_note" {
  if (!input.isAssignee) return "unauthorized";
  if (input.category !== "FEATURE_REQUEST") return "wrong_category";
  if (!Number.isInteger(input.percent) || input.percent < 0 || input.percent > 100) {
    return "invalid_percent";
  }
  if (!input.note.trim()) return "invalid_note";
  return "ok";
}

export function decideProgressWorklogEdit(input: {
  category: string;
  isAssignee: boolean;
  isProgressNote: boolean;
  percent: number;
  note: string;
}):
  | "ok"
  | "unauthorized"
  | "wrong_category"
  | "invalid_percent"
  | "invalid_note"
  | "wrong_kind" {
  if (!input.isProgressNote) return "wrong_kind";
  return decideProgressUpdate(input);
}

export function decideProgressWorklogDelete(input: {
  category: string;
  isAssignee: boolean;
  isProgressNote: boolean;
}): "ok" | "unauthorized" | "wrong_category" | "wrong_kind" {
  if (!input.isAssignee) return "unauthorized";
  if (input.category !== "FEATURE_REQUEST") return "wrong_category";
  if (!input.isProgressNote) return "wrong_kind";
  return "ok";
}

export function expiryActionForStage(
  stage: ConfirmTokenStage,
): "notify" | "close" {
  return stage === "RESOLVED" ? "close" : "notify";
}

export function tokenAllowedActions(
  stage: ConfirmTokenStage,
): ConfirmTokenAction[] {
  if (stage === "AWAITING_USER_TEST") {
    return ["approve-and-close", "report-issue"];
  }
  return ["reopen"];
}

export type QuickLogDecision =
  | "ok"
  | "unauthorized"
  | "invalid_department"
  | "invalid_issue"
  | "invalid_resolve";

const WALK_UP_REQUESTER_NAME = "Walk-up";

export function decideQuickLog(input: {
  actorRole: string | undefined;
  departmentCode: string;
  issue: string;
  resolve: string;
}): QuickLogDecision {
  if (!isItSessionRole(input.actorRole)) return "unauthorized";
  if (!input.departmentCode.trim()) return "invalid_department";
  if (!input.issue.trim()) return "invalid_issue";
  if (!input.resolve.trim()) return "invalid_resolve";
  return "ok";
}

export function formatQuickLogDescription(issue: string, resolve: string): string {
  return `${issue.trim()}\n\n${resolve.trim()}`;
}

export function quickLogRequesterName(name: string | undefined): string {
  const trimmed = name?.trim() ?? "";
  return trimmed || WALK_UP_REQUESTER_NAME;
}

export function normalizeTicketNo(value: string): string {
  return value.trim().replace(/^#/, "").toLowerCase();
}

export function confirmationMatchesTicketNo(
  confirmation: string,
  ticketNo: string,
): boolean {
  const typed = normalizeTicketNo(confirmation);
  const expected = normalizeTicketNo(ticketNo);
  return typed.length > 0 && typed === expected;
}

export function decideHardDelete(input: {
  actorRole: string | undefined;
  confirmation: string;
  ticketNo: string;
}): "ok" | "unauthorized" | "invalid_confirmation" {
  if (!isItSessionRole(input.actorRole)) return "unauthorized";
  if (!confirmationMatchesTicketNo(input.confirmation, input.ticketNo)) {
    return "invalid_confirmation";
  }
  return "ok";
}
