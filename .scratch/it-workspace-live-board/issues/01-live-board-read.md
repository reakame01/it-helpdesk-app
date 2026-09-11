# 01: Live board read — real tickets on the kanban

**What to build:** Guests and IT can open the IT Workspace and see real Board Cards from the database (including requester identity and attachments), mapped into backlog / in progress / Awaiting User Test / Resolved+Closed columns, with basic metrics and filters. Portal-reported tickets appear without mock data.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Board list HTTP API returns tickets with column mapping per ADR 0004 / CONTEXT
- [x] Status model supports distinct Awaiting User Test (not overloaded unrelated approval)
- [x] Kanban UI loads from API (no mock ticket list for the happy path)
- [x] Guest can view full requester identity; metrics/filters work on real data
- [x] API seam tests cover list mapping for representative statuses

## Answer

Shipped public `GET /tickets/board` with pure `mapTicketToBoardColumn` / `toBoardTicketDto` (ADR 0004 columns; legacy `PENDING_APPROVAL` → `pending_user`). Prisma + `@helpdesk/types` gained `AWAITING_USER_TEST`, optional `Ticket.progress`, and `TicketAssignee.role` (`LEAD`|`COLLABORATOR`). Kanban loads from the API on mount/refresh/focus, shows requester identity, gates Claim/write UI on IT session, and keeps Quick Log for signed-in IT only.

**Verify:** `pnpm --filter api exec prisma migrate deploy` (or `db:migrate`), `pnpm --filter api exec prisma generate`, `pnpm --filter @helpdesk/types build`, `pnpm --filter api run test:board-mapping`.
