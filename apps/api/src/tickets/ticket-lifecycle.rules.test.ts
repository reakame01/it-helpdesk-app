import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decideAddCollaborator,
  decideApproveAndClose,
  decideClaim,
  decideProgressUpdate,
  decideProgressWorklogDelete,
  decideProgressWorklogEdit,
  decideQuickLog,
  decideRemoveCollaborator,
  decideReportIssue,
  decideReopen,
  decideResend,
  decideSendForUserTest,
  decideWithdraw,
  decideHardDelete,
  formatQuickLogDescription,
  confirmationMatchesTicketNo,
  quickLogRequesterName,
  expiryActionForStage,
  latestProgressPercent,
  nextLeadUserIdAfterWithdraw,
  parseProgressWorklogNote,
  tokenAllowedActions,
} from "./ticket-lifecycle.rules.ts";

describe("decideClaim", () => {
  it("allows an IT session to Claim a card with no Lead", () => {
    assert.equal(
      decideClaim({ actorRole: "IT_STAFF", hasLead: false }),
      "ok",
    );
  });

  it("rejects Claim when a Lead already exists", () => {
    assert.equal(
      decideClaim({ actorRole: "IT_STAFF", hasLead: true }),
      "already_has_lead",
    );
  });

  it("rejects Claim without an IT session", () => {
    assert.equal(
      decideClaim({ actorRole: undefined, hasLead: false }),
      "unauthorized",
    );
    assert.equal(
      decideClaim({ actorRole: "USER", hasLead: false }),
      "unauthorized",
    );
  });
});

describe("decideAddCollaborator", () => {
  it("allows the Lead to add a Collaborator", () => {
    assert.equal(
      decideAddCollaborator({
        actorRole: "IT_STAFF",
        hasLead: true,
        alreadyAssigned: false,
        isLead: true,
      }),
      "ok",
    );
  });

  it("rejects adding a Collaborator when there is no Lead", () => {
    assert.equal(
      decideAddCollaborator({
        actorRole: "IT_STAFF",
        hasLead: false,
        alreadyAssigned: false,
        isLead: false,
      }),
      "no_lead",
    );
  });

  it("rejects a non-Lead IT session even when a Lead exists", () => {
    assert.equal(
      decideAddCollaborator({
        actorRole: "SUPERVISOR",
        hasLead: true,
        alreadyAssigned: false,
        isLead: false,
      }),
      "unauthorized",
    );
  });
});

describe("decideRemoveCollaborator", () => {
  it("allows the Lead to remove a Collaborator", () => {
    assert.equal(
      decideRemoveCollaborator({
        isLead: true,
        targetIsCollaborator: true,
      }),
      "ok",
    );
  });

  it("rejects removing the Lead or acting without being Lead", () => {
    assert.equal(
      decideRemoveCollaborator({
        isLead: true,
        targetIsCollaborator: false,
      }),
      "wrong_kind",
    );
    assert.equal(
      decideRemoveCollaborator({
        isLead: false,
        targetIsCollaborator: true,
      }),
      "unauthorized",
    );
  });
});

describe("decideWithdraw", () => {
  it("allows an Assignee to withdraw from In progress", () => {
    assert.equal(
      decideWithdraw({ status: "IN_PROGRESS", isAssignee: true }),
      "ok",
    );
  });

  it("rejects a Guest and stages other than In progress", () => {
    assert.equal(
      decideWithdraw({ status: "IN_PROGRESS", isAssignee: false }),
      "unauthorized",
    );
    assert.equal(
      decideWithdraw({ status: "OPEN", isAssignee: true }),
      "wrong_status",
    );
    assert.equal(
      decideWithdraw({ status: "AWAITING_USER_TEST", isAssignee: true }),
      "wrong_status",
    );
  });
});

describe("nextLeadUserIdAfterWithdraw", () => {
  const assigned = (userId: string, role: string, assignedAt: string) => ({
    userId,
    role,
    assignedAt,
  });

  it("returns null when the last Assignee withdraws", () => {
    assert.equal(
      nextLeadUserIdAfterWithdraw(
        [assigned("lead-1", "LEAD", "2026-09-11T01:00:00.000Z")],
        "lead-1",
      ),
      null,
    );
  });

  it("promotes the Collaborator invited earliest when the Lead withdraws", () => {
    assert.equal(
      nextLeadUserIdAfterWithdraw(
        [
          assigned("lead-1", "LEAD", "2026-09-11T01:00:00.000Z"),
          assigned("collab-b", "COLLABORATOR", "2026-09-11T03:00:00.000Z"),
          assigned("collab-a", "COLLABORATOR", "2026-09-11T02:00:00.000Z"),
        ],
        "lead-1",
      ),
      "collab-a",
    );
  });

  it("keeps the Lead when a Collaborator withdraws", () => {
    assert.equal(
      nextLeadUserIdAfterWithdraw(
        [
          assigned("lead-1", "LEAD", "2026-09-11T01:00:00.000Z"),
          assigned("collab-a", "COLLABORATOR", "2026-09-11T02:00:00.000Z"),
        ],
        "collab-a",
      ),
      "lead-1",
    );
  });
});

describe("decideSendForUserTest", () => {
  it("allows an Assignee on active work", () => {
    assert.equal(
      decideSendForUserTest({ status: "IN_PROGRESS", isAssignee: true }),
      "ok",
    );
  });

  it("rejects a Guest and wrong stage", () => {
    assert.equal(
      decideSendForUserTest({ status: "IN_PROGRESS", isAssignee: false }),
      "unauthorized",
    );
    assert.equal(
      decideSendForUserTest({ status: "OPEN", isAssignee: true }),
      "wrong_status",
    );
  });
});

describe("decideApproveAndClose", () => {
  it("allows an Assignee or a valid Awaiting User Test token", () => {
    assert.deepEqual(
      decideApproveAndClose({
        status: "AWAITING_USER_TEST",
        isAssignee: true,
        tokenValidForAwaiting: false,
      }),
      { ok: true, actorKind: "ASSIGNEE" },
    );
    assert.deepEqual(
      decideApproveAndClose({
        status: "AWAITING_USER_TEST",
        isAssignee: false,
        tokenValidForAwaiting: true,
      }),
      { ok: true, actorKind: "REQUESTER_TOKEN" },
    );
  });

  it("rejects outside Awaiting User Test", () => {
    assert.equal(
      decideApproveAndClose({
        status: "IN_PROGRESS",
        isAssignee: true,
        tokenValidForAwaiting: false,
      }).ok,
      false,
    );
  });
});

describe("decideReportIssue", () => {
  it("allows a requester token with a reason during Awaiting User Test", () => {
    assert.equal(
      decideReportIssue({
        status: "AWAITING_USER_TEST",
        tokenValidForAwaiting: true,
        reason: "Still broken",
      }),
      "ok",
    );
  });

  it("rejects missing reason and wrong stage", () => {
    assert.equal(
      decideReportIssue({
        status: "AWAITING_USER_TEST",
        tokenValidForAwaiting: true,
        reason: "  ",
      }),
      "invalid_reason",
    );
    assert.equal(
      decideReportIssue({
        status: "RESOLVED",
        tokenValidForAwaiting: true,
        reason: "Still broken",
      }),
      "wrong_status",
    );
  });
});

describe("decideReopen", () => {
  it("allows Reopen only in Resolved", () => {
    assert.deepEqual(
      decideReopen({
        status: "RESOLVED",
        isAssignee: true,
        tokenValidForResolved: false,
        reason: "Came back",
      }),
      { ok: true, actorKind: "ASSIGNEE" },
    );
    assert.equal(
      decideReopen({
        status: "AWAITING_USER_TEST",
        isAssignee: true,
        tokenValidForResolved: false,
        reason: "Came back",
      }).ok,
      false,
    );
  });
});

describe("decideResend and expiry", () => {
  it("allows Resend in Awaiting User Test or Resolved", () => {
    assert.equal(
      decideResend({ status: "AWAITING_USER_TEST", isAssignee: true }),
      "ok",
    );
    assert.equal(decideResend({ status: "RESOLVED", isAssignee: true }), "ok");
  });

  it("keeps Awaiting User Test and closes Resolved on unused expiry", () => {
    assert.equal(expiryActionForStage("AWAITING_USER_TEST"), "notify");
    assert.equal(expiryActionForStage("RESOLVED"), "close");
  });

  it("scopes token actions by stage", () => {
    assert.deepEqual(tokenAllowedActions("AWAITING_USER_TEST"), [
      "approve-and-close",
      "report-issue",
    ]);
    assert.deepEqual(tokenAllowedActions("RESOLVED"), ["reopen"]);
  });
});

describe("decideProgressUpdate", () => {
  it("allows 0-100 with a note on Feature Request only", () => {
    assert.equal(
      decideProgressUpdate({
        category: "FEATURE_REQUEST",
        isAssignee: true,
        percent: 40,
        note: "API wired",
      }),
      "ok",
    );
    assert.equal(
      decideProgressUpdate({
        category: "HARDWARE",
        isAssignee: true,
        percent: 40,
        note: "n/a",
      }),
      "wrong_category",
    );
  });
});

describe("progress worklog mutate", () => {
  it("lets an Assignee correct a Development Progress note", () => {
    assert.equal(
      decideProgressWorklogEdit({
        category: "FEATURE_REQUEST",
        isAssignee: true,
        isProgressNote: true,
        percent: 45,
        note: "API Spec designed",
      }),
      "ok",
    );
  });

  it("rejects editing a non-progress worklog", () => {
    assert.equal(
      decideProgressWorklogEdit({
        category: "FEATURE_REQUEST",
        isAssignee: true,
        isProgressNote: false,
        percent: 45,
        note: "Came back",
      }),
      "wrong_kind",
    );
  });

  it("lets an Assignee hard-delete a Development Progress note", () => {
    assert.equal(
      decideProgressWorklogDelete({
        category: "FEATURE_REQUEST",
        isAssignee: true,
        isProgressNote: true,
      }),
      "ok",
    );
    assert.equal(
      decideProgressWorklogDelete({
        category: "FEATURE_REQUEST",
        isAssignee: false,
        isProgressNote: true,
      }),
      "unauthorized",
    );
    assert.equal(
      decideProgressWorklogDelete({
        category: "FEATURE_REQUEST",
        isAssignee: true,
        isProgressNote: false,
      }),
      "wrong_kind",
    );
  });

  it("reads current progress from the newest remaining Development Progress note", () => {
    assert.equal(
      latestProgressPercent([
        "Came back",
        "Development Progress 80%: wired confirm token",
        "Development Progress 40%: API Spec designed",
      ]),
      80,
    );
    assert.equal(latestProgressPercent(["Reopened for a leftover bug"]), 0);
    assert.deepEqual(parseProgressWorklogNote("Development Progress 40%: API Spec designed"), {
      percent: 40,
      summary: "API Spec designed",
    });
  });
});

describe("decideQuickLog", () => {
  it("allows an IT session to record a walk-up fix", () => {
    assert.equal(
      decideQuickLog({
        actorRole: "IT_STAFF",
        departmentCode: "account",
        issue: "Printer jam",
        resolve: "Cleared paper and reprinted",
      }),
      "ok",
    );
    assert.equal(
      decideQuickLog({
        actorRole: "SUPERVISOR",
        departmentCode: "hr",
        issue: "Wrong keyboard language",
        resolve: "Switched to TH",
      }),
      "ok",
    );
  });

  it("rejects Quick Log without an IT session", () => {
    assert.equal(
      decideQuickLog({
        actorRole: undefined,
        departmentCode: "account",
        issue: "Printer jam",
        resolve: "Cleared paper",
      }),
      "unauthorized",
    );
    assert.equal(
      decideQuickLog({
        actorRole: "USER",
        departmentCode: "account",
        issue: "Printer jam",
        resolve: "Cleared paper",
      }),
      "unauthorized",
    );
  });

  it("rejects empty department, issue, or resolution", () => {
    assert.equal(
      decideQuickLog({
        actorRole: "IT_MANAGER",
        departmentCode: "  ",
        issue: "Printer jam",
        resolve: "Cleared paper",
      }),
      "invalid_department",
    );
    assert.equal(
      decideQuickLog({
        actorRole: "IT_STAFF",
        departmentCode: "account",
        issue: "   ",
        resolve: "Cleared paper",
      }),
      "invalid_issue",
    );
    assert.equal(
      decideQuickLog({
        actorRole: "IT_STAFF",
        departmentCode: "account",
        issue: "Printer jam",
        resolve: "",
      }),
      "invalid_resolve",
    );
  });

  it("composes the ticket body from symptom and resolution", () => {
    assert.equal(
      formatQuickLogDescription("  Printer jam  ", " Cleared paper "),
      "Printer jam\n\nCleared paper",
    );
  });

  it("uses Walk-up when the requester name is omitted", () => {
    assert.equal(quickLogRequesterName(undefined), "Walk-up");
    assert.equal(quickLogRequesterName("  "), "Walk-up");
    assert.equal(quickLogRequesterName(" Somporn "), "Somporn");
  });
});

describe("decideHardDelete", () => {
  it("allows an IT session when the typed ticket number matches", () => {
    assert.equal(
      decideHardDelete({
        actorRole: "IT_STAFF",
        confirmation: "#IT-20260911-0001",
        ticketNo: "#IT-20260911-0001",
      }),
      "ok",
    );
    assert.equal(
      decideHardDelete({
        actorRole: "SUPERVISOR",
        confirmation: "IT-20260911-0001",
        ticketNo: "#IT-20260911-0001",
      }),
      "ok",
    );
  });

  it("rejects Hard Delete without an IT session", () => {
    assert.equal(
      decideHardDelete({
        actorRole: undefined,
        confirmation: "#IT-20260911-0001",
        ticketNo: "#IT-20260911-0001",
      }),
      "unauthorized",
    );
    assert.equal(
      decideHardDelete({
        actorRole: "USER",
        confirmation: "#IT-20260911-0001",
        ticketNo: "#IT-20260911-0001",
      }),
      "unauthorized",
    );
  });

  it("rejects a blank or mismatched confirmation", () => {
    assert.equal(
      decideHardDelete({
        actorRole: "IT_MANAGER",
        confirmation: "  ",
        ticketNo: "#IT-20260911-0001",
      }),
      "invalid_confirmation",
    );
    assert.equal(
      decideHardDelete({
        actorRole: "IT_STAFF",
        confirmation: "#IT-20260911-0002",
        ticketNo: "#IT-20260911-0001",
      }),
      "invalid_confirmation",
    );
    assert.equal(
      confirmationMatchesTicketNo("it-20260911-0001", "#IT-20260911-0001"),
      true,
    );
  });
});
