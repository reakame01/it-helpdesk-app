# 06: Reopen, Resend, and token expiry rules

**What to build:** On Resolved, requester (token) or Assignee can Reopen (reason + optional evidence, audited), which returns work to active and breaks success counting for that Resolved attempt. Resolved token expiry without Reopen auto-closes to Closed Ticket. Awaiting User Test token expiry leaves the ticket in place, notifies Assignees, and Assignees can Resend (rotate token) or Approve without waiting for Resend.

**Blocked by:** 04 — Approve and Close

**Status:** resolved

- [x] Reopen only in Resolved; audited; returns to active work
- [x] Resolved expiry without Reopen → Closed Ticket
- [x] Awaiting User Test expiry does not close; Assignees notified
- [x] Resend invalidates old token and issues a new 1-hour token
- [x] API seam tests cover reopen, both expiry behaviours, and resend rotation

## Comments

Previous `resolved` / Answer described a ship that was reverted. Re-implemented in the current tree.

## Answer

JWT `POST /tickets/:id/reopen` and public `POST /tickets/:id/reopen-token` require Resolved + reason, set `reopenBrokenSuccess`, and return to `IN_PROGRESS`. `POST /tickets/:id/resend-confirm` invalidates unused tokens and mails a new 1-hour link. `POST /tickets/process-token-expiry` (also run from `GET /tickets/board`) notifies Assignees on unused Awaiting User Test expiry and auto-closes unused Resolved expiry to Closed Ticket.

**Verify:** Reopen a Resolved card with a reason. Let a Resolved token expire (or backdate `expiresAt`) then Refresh — it should become Closed. Awaiting User Test expiry should stay in place and log a notify mail.
