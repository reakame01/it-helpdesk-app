# IT Helpdesk

Internal IT support workspace: staff report issues, IT works tickets on a shared board, and management reviews outcomes by work cycle.

## Language

### Work tracking

**Work Cycle** (รอบงาน):
A fixed **2-week** planning window for the IT board. The board always belongs to one active Work Cycle until close.
_Avoid_: Sprint (unless speaking casually), month, period

**Work Cycle Close** (ตัดรอบ):
An **automatic** end-of-cycle cutoff (cron) when completed cards leave the active board and incomplete cards move into the next Work Cycle.

**Board Card** (การ์ดบนกระดาน):
A ticket shown on the active Work Cycle kanban. Only open / in-flight work stays here after close.

**Closed Ticket** (ปิดเคสเสร็จ):
A ticket finished only after IT marks done **and the user confirms**. This is the completion state used at Work Cycle Close.
_Avoid_: “Resolved” without user confirm; IT-only done

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

**Reopen**:
When a user reopens a Closed Ticket, the live card belongs to the **Work Cycle in which reopen happened**. Ticket History still records earlier cycles so origin and prior closes remain visible.
_Avoid_: Treating reopen as silent continue of the old closed cycle on the board

### Roles (board)

**Assignee**:
An IT staff member responsible for a ticket; multiple assignees may share one card.

## Example dialogue

> **Dev:** When do we cut the cycle?
> **Domain:** Automatically via cron at the end of each **Work Cycle**.
>
> **Dev:** What counts as finished enough to leave the board?
> **Domain:** Only a **Closed Ticket** — user confirmed. If they **Reopen**, the card is work of the reopen’s cycle, but **Ticket History** still shows which cycles it came from.
>
> **Dev:** If something carries five times, do we stack five tags?
> **Domain:** No. One **Carryover Tag** for the **Origin Cycle**. If origin is cycle 5 and we’re in cycle 10, everyone already sees it’s five cycles old.

## Flagged ambiguities

- **“History”** here means Ticket History for reporting / cycle lineage — not only the per-ticket audit timeline inside the detail drawer.
- **Carryover** ≠ **Reopen**.
- Completion on the board path “pending user” is not Closed until the user confirms.
