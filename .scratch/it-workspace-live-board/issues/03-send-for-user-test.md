# 03: Send for User Test — email deep link

**What to build:** An Assignee can Send for User Test from active work. The ticket enters Awaiting User Test and the requester receives an email whose link opens the IT Workspace with that ticket’s drawer (no buttons in the email body).

**Blocked by:** 02 — Claim with Lead

**Status:** resolved

- [x] Send for User Test transitions status and creates a 1-hour User Confirm Token
- [x] Mail port is invoked with a deep link (mailer mockable in tests)
- [x] Token deep link opens board + drawer for that ticket
- [x] Only Assignees can send; Guest cannot
- [x] API seam tests cover transition + token + mail request

## Answer

`POST /tickets/:id/send-for-user-test` rotates a hashed confirm token (1h), sets `AWAITING_USER_TEST`, and sends mail via `MAILER` port (`ConsoleMailer` default) with `/{locale}/it?ticket=&token=` deep link. Web peeks token and opens the drawer.
