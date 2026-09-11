# 06: Reopen, Resend, and token expiry rules

**What to build:** On Resolved, requester (token) or Assignee can Reopen (reason + optional evidence, audited), which returns work to active and breaks success counting for that Resolved attempt. Resolved token expiry without Reopen auto-closes to Closed Ticket. Awaiting User Test token expiry leaves the ticket in place, notifies Assignees, and Assignees can Resend (rotate token) or Approve without waiting for Resend.

**Blocked by:** 04 — Approve and Close

**Status:** resolved

- [x] Reopen only in Resolved; audited; returns to active work
- [x] Resolved expiry without Reopen → Closed Ticket
- [x] Awaiting User Test expiry does not close; Assignees notified
- [x] Resend invalidates old token and issues a new 1-hour token
- [x] API seam tests cover reopen, both expiry behaviours, and resend rotation

## Answer

Reopen sets `reopenBrokenSuccess` and `IN_PROGRESS`. `POST /tickets/process-token-expiry` applies ADR expiry (notify vs auto-close). `resend-confirm` rotates tokens for Assignees.
