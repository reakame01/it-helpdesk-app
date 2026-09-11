# 03: Send for User Test — email deep link

**What to build:** An Assignee can Send for User Test from active work. The ticket enters Awaiting User Test and the requester receives an email whose link opens the IT Workspace with that ticket’s drawer (no buttons in the email body).

**Blocked by:** 02 — Claim with Lead

**Status:** resolved

- [x] Send for User Test transitions status and creates a 1-hour User Confirm Token
- [x] Mail port is invoked with a deep link (mailer mockable in tests)
- [x] Token deep link opens board + drawer for that ticket
- [x] Only Assignees can send; Guest cannot
- [x] API seam tests cover transition + token + mail request

## Comments

Previous `resolved` / Answer described a ship that was reverted. Re-implemented in the current tree.

## Answer

`POST /api/tickets/:id/send-for-user-test` (JWT Assignee) sets `AWAITING_USER_TEST`, rotates a hashed 1-hour User Confirm Token, and sends mail through the `MAILER` port (`ConsoleMailer` default). The email body is a `/{locale}/it?ticket=&token=` deep link only. Web peeks `GET /tickets/confirm-token` and opens the drawer. Guests cannot send. Token hashing and lifecycle rules are covered by `pnpm --filter api run test:board`.

**Verify:** Claim a card, Send for User Test, confirm the card moves to Awaiting User Test and the API log prints a deep link; open that URL as a Guest and see the drawer.
