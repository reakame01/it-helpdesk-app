# ADR 0003: User confirm / reopen via email token

## Status

Accepted (product intent — not implemented yet; for full kanban / notification work)

## Context

Employees do not have app accounts. Closing a ticket still requires the requester’s confirmation. Reopen must stay possible while the case is not finally closed, without forcing login.

## Decision

1. Ticket intake **requires corporate email** (the address used on the company PC day to day).
2. When IT marks work ready for confirm, the system emails the requester a **temporary token** link with two actions while the token is valid:
   - **Close ticket** (user confirm → **Closed Ticket**)
   - **Reopen** (“still not resolved”)
3. Token rules:
   - Expires after **1 hour**, or
   - Becomes invalid after **one successful use** (close or reopen), whichever comes first
4. **Reopen** (while not Closed):
   - Allowed **unlimited times** until the ticket becomes a Closed Ticket
   - Requires a **reason** and may include a **screenshot** / attachments showing the issue remains
   - Live board card follows ADR 0001 reopen cycle rules (`Reopened` / current Work Cycle)
5. After the user **closes** successfully:
   - **Reopen is not allowed** on that ticket
   - Further problems require a **new ticket** (optional reference to the prior Ticket ID)
6. If the token expired unused: show a clear message; user may request a new confirm email via IT, or open a new ticket if appropriate.
7. IT may still reopen / adjust from the board as an operational fallback (out of band).

## Consequences

- Email delivery and token pages become part of the close path (not only in-app buttons).
- Portal form must treat email as required, not optional.
- Closed Ticket is a hard terminal state for the requester; analytics and Work Cycle Close can rely on it.

## Notes

Captured from product discussion before full kanban implementation.
