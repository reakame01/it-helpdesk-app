# IT Helpdesk

Internal IT support workspace: staff report issues, IT works tickets on a shared board, and management reviews outcomes by work cycle.

## Access model

**Guest (no login)** — anyone on the corporate intranet can report cases, **view** the IT board (read-only), and use IT Overview (including exports). No self-registration.

**IT session** — only IT staff sign in (accounts created in User Management). Required for board write actions, User Management, and Data References. Header: **IT Sign in** dialog when signed out; avatar menu (**Edit profile** / **Log out**) when signed in.

See `docs/adr/0002-intranet-guest-and-it-signin.md`.

## Language

### Work tracking

**Report Range** (ช่วงเวลารายงาน):
How the GM dashboard scopes metrics: a single **Work Cycle**, a **calendar month**, or a **calendar year**. Month/year views aggregate Ticket History across the work cycles inside that range; export uses the selected range once.
_Avoid_: Asking GM to export multiple cycles and merge manually

**Work Cycle** (รอบงาน):
A fixed **2-week** planning window for the IT board. The board always belongs to one active Work Cycle until close.
_Avoid_: Sprint (unless speaking casually), month, period

**Work Cycle Close** (ตัดรอบ):
An **automatic** end-of-cycle cutoff (cron) when completed cards leave the active board and incomplete cards move into the next Work Cycle.

**Board Card** (การ์ดบนกระดาน):
A ticket shown on the active Work Cycle kanban. Only open / in-flight work stays here after close.

**Closed Ticket** (ปิดเคสเสร็จ):
A ticket finished only after IT marks done **and the user confirms via email token**. This is a **terminal** state for the requester: they cannot reopen; further issues need a **new ticket**.
_Avoid_: “Resolved” without user confirm; IT-only done; reopen after user close

**Ticket History** (ประวัติเคส):
Closed Tickets removed from the board at Work Cycle Close, kept for dashboard metrics and later review. Also retains which Work Cycle(s) the ticket belonged to over time.
_Avoid_: Archive-only dumping ground with no reporting use

**Carryover** (งานยกยอด):
An unfinished Board Card moved into the next Work Cycle at close.
_Avoid_: Reopen (different meaning)

**Origin Cycle** (รอบต้นทาง):
The first Work Cycle in which the card entered the board. Used for the single Carryover Tag even if the card spans many later cycles.

**Carryover Tag**:
A single label on a Carryover card naming only the **Origin Cycle** (e.g. “ยกมาจากรอบงานที่ 5”). Tags are **not stacked** per carryover; age is implied by comparing Origin Cycle to the current cycle.
_Avoid_: Accumulating “from cycle 5, 6, 7…” badges

**User Confirm Token** (โทเคนยืนยันทางอีเมล):
One-time link emailed to the requester’s **required corporate email**. Valid for **1 hour** or until used once. Actions while valid: confirm close, or reopen with reason (+ optional screenshot). See `docs/adr/0003-email-token-close-and-reopen.md`.

**Reopen**:
Requester marks the case still unresolved **before** it becomes a Closed Ticket (via email token). Unlimited while open; requires reason and may attach evidence. The live card belongs to the **Work Cycle in which reopen happened**. After user close → no reopen; open a new ticket instead.
_Avoid_: Treating reopen as silent continue of the old closed cycle on the board; allowing reopen after Closed Ticket

### Roles (login accounts)

Hierarchy (highest → lowest): **GM** → **Supervisor** → **IT Staff**.

| Role | Meaning |
|------|---------|
| **GM** | General Manager — oversight / IT Overview |
| **Supervisor** | IT supervisor — leads the IT team |
| **IT Staff** | Day-to-day IT operators on the board |

Accounts are provisioned in User Management. Guests (no login) are not assigned these roles.

### Roles (board)

**Assignee**:
An IT staff member responsible for a ticket; multiple assignees may share one card.

## Example dialogue

> **Dev:** When do we cut the cycle?
> **Domain:** Automatically via cron at the end of each **Work Cycle**.
>
> **Dev:** What counts as finished enough to leave the board?
> **Domain:** Only a **Closed Ticket** — user confirmed by email token. If they **Reopen** before that, the card is work of the reopen’s cycle, but **Ticket History** still shows which cycles it came from.
>
> **Dev:** Can they reopen after they already closed?
> **Domain:** No. Closed is final for that ticket; file a new one.
>
> **Dev:** If something carries five times, do we stack five tags?
> **Domain:** No. One **Carryover Tag** for the **Origin Cycle**. If origin is cycle 5 and we’re in cycle 10, everyone already sees it’s five cycles old.

## Flagged ambiguities

- **“History”** here means Ticket History for reporting / cycle lineage — not only the per-ticket audit timeline inside the detail drawer.
- **Carryover** ≠ **Reopen**.
- Completion on the board path “pending user” is not Closed until the user confirms via token.
- Guest board access is view-only until IT write guards are fully enforced in the kanban UI.
