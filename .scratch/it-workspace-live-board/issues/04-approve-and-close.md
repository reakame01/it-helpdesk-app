# 04: Approve and Close — to Resolved with audit

**What to build:** During Awaiting User Test, the requester (via token) or an Assignee can Approve and Close. The actor is audited. The ticket becomes Resolved and a Resolved-stage reopen token email is always sent.

**Blocked by:** 03 — Send for User Test

**Status:** resolved

- [x] Approve and Close allowed for token holder and Assignees only in Awaiting User Test
- [x] Audit records whether actor was requester token or Assignee
- [x] Transition to Resolved + reopen-stage token email always sent
- [x] UI shows Approve and Close only in Awaiting User Test; Guest without token cannot use it
- [x] API seam tests cover both actor types and stage guard

## Comments

Previous `resolved` / Answer described a ship that was reverted. Re-implemented in the current tree.

## Answer

JWT `POST /tickets/:id/approve-and-close` and public `POST /tickets/:id/approve-and-close-token` both require Awaiting User Test. Audit metadata stores `actorKind` (`ASSIGNEE` | `REQUESTER_TOKEN`). Status becomes `RESOLVED` and a Resolved-stage 1-hour token email is always sent. Drawer shows Approve and Close only in that stage.

**Verify:** Approve as Assignee and via the email token; both should land in Resolved and print a reopen deep link. Guest without token must not see the action.
