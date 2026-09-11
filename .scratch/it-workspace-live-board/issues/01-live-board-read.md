# 01: Live board read — real tickets on the kanban

**What to build:** Guests and IT can open the IT Workspace and see real Board Cards from the database (including requester identity and attachments), mapped into backlog / in progress / Awaiting User Test / Resolved+Closed columns, with basic metrics and filters. Portal-reported tickets appear without mock data.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Board list HTTP API returns tickets with column mapping per ADR 0004 / CONTEXT
- [x] Status model supports distinct Awaiting User Test (not overloaded unrelated approval)
- [x] Kanban UI loads from API (no mock ticket list for the happy path)
- [x] Guest can view full requester identity; metrics/filters work on real data
- [x] API seam tests cover list mapping for representative statuses

## Comments

Previous `resolved` / Answer described a ship that was reverted. Re-implemented in the current tree.

## Answer

Public `GET /api/tickets/board` maps tickets with `mapTicketToBoardColumn` (OPEN+no Lead → backlog; IN_PROGRESS or Lead → in_progress; `AWAITING_USER_TEST` and legacy `PENDING_APPROVAL` → pending_user; Resolved+Closed share the rightmost column). Prisma adds `AWAITING_USER_TEST` and `TicketAssignee.role`. Kanban loads from the API on mount/refresh/focus, shows requester name/email/extension/attachments, and no longer uses `mockKanbanTickets` for the board. Mapping tests live in `apps/api/src/tickets/board-column.mapping.test.ts`.

**Verify:** `pnpm --filter @helpdesk/types build`, `pnpm --filter api exec prisma migrate deploy`, `pnpm --filter api exec prisma generate`, `pnpm --filter api run test:board`.
