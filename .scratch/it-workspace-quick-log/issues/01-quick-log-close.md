# 01: Quick Log creates a Closed Ticket

**What to build:** IT session `POST /tickets/quick-log` creates a `QUICK_TICKET` Closed Ticket (actor as Lead) and the workspace dialog persists it instead of a fake toast. Guest cannot submit. Card appears in the Resolved/Closed column. Supervisor approval, drag-and-drop, and realtime stay out.

**Blocked by:** None

**Status:** resolved

- [x] Lifecycle rules reject non-IT sessions and empty issue/resolve/department
- [x] API creates CLOSED `QUICK_TICKET` with Lead + worklog + audit
- [x] Board DTO includes ticket type; dialog uses Data References departments
- [x] After save, board refreshes and shows the card

## Comments

Implemented against ADR 0005: close immediately, no confirm token, no Supervisor approval slice.

## Answer

`POST /api/tickets/quick-log` (JWT IT session) creates a Closed Ticket (`QUICK_TICKET`), assigns the actor as Lead, writes a resolution worklog, and returns a board DTO in the rightmost column. The workspace dialog loads departments from Data References and persists instead of a fake toast. Guests do not see the button.

**Verify:** Sign in, Quick Log a walk-up fix, see the card under เสร็จสมบูรณ์ / ปิดแล้ว with a งานด่วน badge. Guest view hides the button. Empty issue/department is rejected.
