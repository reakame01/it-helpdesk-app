# ADR 0004: Two-stage verify (Awaiting User Test → Resolved → Closed)

Board closure is two stages so we are not too strict on requesters, while still keeping a terminal **Closed Ticket** and an auditable actor.

## Status

Accepted

## Decision

1. **Awaiting User Test** (`pending_user`): IT has finished hands-on work and waits for verification. Email sends a **User Confirm Token** deep link (no buttons in the mail body) that opens the IT board with that ticket’s drawer.
2. In Awaiting User Test, allowed token/IT actions are **Approve and Close** and **Report Issue** (not called Reopen). **Approve and Close** may be done by the requester via token **or** by an **Assignee**; always **audit who acted**. Assignees may Approve and Close immediately in this stage without waiting for Resend.
3. **Report Issue** returns the card to active IT work; requires reason; optional evidence.
4. If the Awaiting User Test token expires unused, the ticket **stays** in Awaiting User Test; notify Assignees; they may **Resend** (invalidate old token) and/or Approve and Close themselves.
5. **Approve and Close** moves the ticket to **Resolved** and starts a Resolved-stage token window whose only requester action is **Reopen**.
6. **Resolved**: Reopen may be done by requester via token **or** by an Assignee; audit the actor; requires reason; optional evidence. A Resolved ticket that is Reopened does **not** count as a successful close in dashboard metrics.
7. If the Resolved-stage token expires with no Reopen, the ticket becomes a **Closed Ticket** automatically (terminal for that ticket id).
8. Resend is allowed for Assignees and rotates tokens (old token dies immediately).

## Why

- Rejected “user-only approve” as too fussy for busy staff; Assignees may close the verify stage but must be logged.
- Rejected “token expiry in Awaiting User Test ⇒ Closed” because silence must not imply the fix worked.
- Rejected collapsing Resolved into Closed immediately so there is still a Reopen window after approval.
- Kept email as a deep link into the board/drawer so guests need no app account for stage actions.

## Consequences

- UI “Approve and Close” appears only in Awaiting User Test.
- Rightmost kanban column may show Resolved and Closed together; domain and metrics still distinguish them.
- Mailer, token pages, and audit events are required in the first live close path (product chose real email in phase 1 board work).
- Supersedes ADR 0003’s single-step close/reopen email model.
