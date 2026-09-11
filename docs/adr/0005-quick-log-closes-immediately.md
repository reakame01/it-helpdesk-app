# ADR 0005: Quick Log closes immediately

Walk-up fixes are already verified in person, often with no requester email. **Quick Log** therefore becomes a **Closed Ticket** in one step instead of Awaiting User Test → Resolved → Closed (ADR 0004).

## Status

Accepted

## Decision

A **Quick Log** (`QUICK_TICKET`) created by an **IT session** is a **Closed Ticket** immediately: the actor is **Lead**, no **User Confirm Token**, and no Supervisor approval gate in this slice. Standard portal tickets still follow ADR 0004.

## Why

- Rejected putting these cards through Awaiting User Test: there is often no email, and the requester already saw the fix.
- Rejected Supervisor approval before counting: the dialog is “ปิดเคสทันที / Close immediately”; approval can be added later via `QuickTicketApproval` without changing the walk-up form.
- Rejected hiding Closed Quick Logs from the board: until Work Cycle Close exists, they stay in the rightmost column so the work is visible.

## Consequences

- Quick Log does not send confirm email and cannot **Reopen** (Closed is terminal).
- Dashboard success may count these Closed Tickets like other successful closes.
