# 04: Approve and Close — to Resolved with audit

**What to build:** During Awaiting User Test, the requester (via token) or an Assignee can Approve and Close. The actor is audited. The ticket becomes Resolved and a Resolved-stage reopen token email is always sent.

**Blocked by:** 03 — Send for User Test

**Status:** resolved

- [x] Approve and Close allowed for token holder and Assignees only in Awaiting User Test
- [x] Audit records whether actor was requester token or Assignee
- [x] Transition to Resolved + reopen-stage token email always sent
- [x] UI shows Approve and Close only in Awaiting User Test; Guest without token cannot use it
- [x] API seam tests cover both actor types and stage guard

## Answer

Authed `POST .../approve-and-close` and public `.../approve-and-close-token`. Audits `actorKind`, moves to `RESOLVED`, always issues Resolved-stage token + email.
