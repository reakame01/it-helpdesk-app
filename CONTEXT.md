# IT Helpdesk

Internal IT support workspace: staff report issues, IT works tickets on a shared board, and management reviews outcomes by work cycle.

## Access model

**Guest (no login)** — anyone on the corporate intranet can report cases, **view** the IT board (including requester identity on cards/drawers), and use IT Overview (including exports). Guests cannot perform board write actions in the app. Close / Report Issue / Reopen from email use a **User Confirm Token** deep link instead. No self-registration.

**IT session** — only IT staff sign in (accounts created in User Management). Required for board write actions, User Management, and Data References. Header: **IT Sign in** dialog when signed out; avatar menu (**Edit profile** / **Log out**) when signed in.

See `docs/adr/0002-intranet-guest-and-it-signin.md`.

## Language

### Work tracking

**Report Range** (ช่วงเวลารายงาน):
How the IT Overview (IT Manager) dashboard scopes metrics: a single **Work Cycle**, a **calendar month**, or a **calendar year**. Month/year views aggregate Ticket History across the work cycles inside that range; export uses the selected range once.
_Avoid_: Asking IT Manager to export multiple cycles and merge manually

**Work Cycle** (รอบงาน):
A fixed **2-week** planning window for the IT board. The board always belongs to one active Work Cycle until close.
_Avoid_: Sprint (unless speaking casually), month, period

**Work Cycle Close** (ตัดรอบ):
An **automatic** end-of-cycle cutoff (cron) when completed cards leave the active board and incomplete cards move into the next Work Cycle.

**Board Card** (การ์ดบนกระดาน):
A ticket shown on the kanban. Until Work Cycle exists in product, the live board shows every ticket that is not yet out of active operations per current rules; later, only the active Work Cycle’s in-flight work remains after close.

**Awaiting User Test** (รอผู้ใช้ทดสอบ / คอลัมน์ `pending_user`):
IT believes the fix is ready and is waiting for the requester to verify. This is **not** a Closed Ticket. From here the requester may **Approve and Close** (advance to Resolved) or **Report Issue**; they do **not** “Reopen” in this stage.
_Avoid_: Calling this Resolved; calling Report Issue “Reopen”

**Resolved**:
A post-approval cooling state: the case was approved out of Awaiting User Test but is **not yet** a Closed Ticket. While the Resolved-stage token is valid, **Reopen** is allowed. If that token expires with no Reopen, the ticket becomes a **Closed Ticket** automatically.
_Avoid_: Treating Resolved as final success forever; using “Reopen” as the label on Awaiting User Test actions

**Closed Ticket** (ปิดเคสเสร็จ):
A **terminal** ticket state for the requester: no further Reopen on that ticket; further problems need a **new ticket**. It is reached when the Resolved-stage reopen window ends without Reopen (token expiry), not merely when IT finishes hands-on work.
_Avoid_: “Resolved” as the final word; IT-only done without the Resolved window rules

**Approve and Close**:
The action that moves a ticket from **Awaiting User Test** to **Resolved**. Either the requester (via token link) or an **Assignee** on the ticket may perform it. Who did it must be auditable.
_Avoid_: Using this action outside Awaiting User Test

**Report Issue** (แจ้งเพิ่ม):
Requester feedback during **Awaiting User Test** that the problem remains or needs more work. Returns the live card to active IT work. Requires a reason; may include evidence. Distinct from **Reopen**.
_Avoid_: Reopen (Resolved-only term)

**Reopen**:
Requester or an **Assignee** marks a **Resolved** ticket as still unresolved before it becomes a **Closed Ticket**. Requires a reason; may include evidence. Unlimited until Closed. Affects success metrics (a Resolved ticket that is Reopened does not count as a successful close). The live card belongs to the **Work Cycle in which reopen happened** once cycles exist.
_Avoid_: Using “Reopen” during Awaiting User Test; reopen after Closed Ticket

**User Confirm Token** (โทเคนยืนยันทางอีเมล):
A temporary deep-link credential emailed to the requester’s corporate email. The email itself has **no action buttons**—the link opens the IT board with that ticket’s drawer. Allowed in-drawer actions depend on stage (Awaiting User Test vs Resolved). Assignees may **resend**, which invalidates the previous token. See `docs/adr/0003-email-token-close-and-reopen.md` and `docs/adr/0004-two-stage-user-verify-and-resolved-window.md`.

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

### Roles (login accounts)

Hierarchy (highest → lowest): **IT Manager** → **Supervisor** → **IT Staff**.

| Role | Meaning |
|------|---------|
| **IT_MANAGER** | IT Manager — oversight / IT Overview |
| **Supervisor** | IT supervisor — leads the IT team |
| **IT Staff** | Day-to-day IT operators on the board |

Accounts are provisioned in User Management. Guests (no login) are not assigned these roles.

### Roles (board)

**Assignee**:
An IT staff member on a ticket. One assignee is the **Lead**; others are **Collaborators**.

**Lead**:
The primary assignee. The first successful **Claim** from backlog becomes Lead. Claim cannot steal a card that already has a Lead; add Collaborator or transfer instead. If the Lead **Withdraws** while Collaborators remain, the Collaborator invited earliest becomes Lead.

**Collaborator**:
An additional assignee helping on the same card without replacing the Lead. A Collaborator may **Withdraw** without affecting the Lead.

**Claim**:
An IT session action that takes an unassigned backlog card into active work and becomes its Lead.

**Withdraw** (ถอนตัว):
An Assignee leaves a card that is in active work. If anyone remains, work stays in progress (and a departing Lead is succeeded as above). If nobody remains, the card returns to the waiting column (backlog) so someone else can Claim it.
_Avoid_: Treating Claim as irreversible; withdrawing during Awaiting User Test / Resolved / Closed

**Send for User Test**:
An Assignee action from active work that moves a ticket into **Awaiting User Test** and emails the first **User Confirm Token** deep link.

**Development Progress** (ความคืบหน้างานพัฒนา):
A 0–100% completion indicator used only for **Feature Request / new development** tickets while in active work. Assignees update it together with a short note of what changed so others can see movement on the card and in the drawer.
_Avoid_: Progress bars on hardware/network/break-fix style tickets; treating progress as a substitute for Awaiting User Test / Resolved / Closed

**Quick Log** (บันทึกงานด่วน):
An **IT session** record of a walk-up fix already finished on the floor. It becomes a **Closed Ticket** immediately (`QUICK_TICKET`); it does not enter **Awaiting User Test** or **Resolved**. The actor is the **Lead**. Optional requester name; department is required for later reporting.
_Avoid_: Sending a User Confirm Token for these cases; treating Quick Log as a Supervisor approval queue; calling this Claim

**Hard Delete** (ลบ Ticket):
An **IT session** purge of a ticket entered in error. It removes the Board Card and related records (worklogs, attachments, confirm tokens, assignees, ticket audit). Confirmation must match the ticket number. This is not a **Closed Ticket**.
_Avoid_: Closed Ticket; requester-facing close; Guest delete

## Example dialogue

> **Dev:** When do we cut the cycle?
> **Domain:** Automatically via cron at the end of each **Work Cycle**.
>
> **Dev:** What counts as finished enough to leave the board after cycle close?
> **Domain:** **Closed Ticket**. **Resolved** still has a reopen window and is not terminal yet.
>
> **Dev:** User says it’s fixed while we’re in Awaiting User Test — who clicks Approve and Close?
> **Domain:** Either the user via the email link, or an Assignee. Log which actor closed the stage.
>
> **Dev:** Can they reopen after Closed?
> **Domain:** No. File a new ticket.
>
> **Dev:** Token expired in Awaiting User Test and nobody clicked — is it Closed?
> **Domain:** No. It stays Awaiting User Test. IT can still Approve and Close, or Resend the link. Optionally nudge the user offline.
>
> **Dev:** Do all in-progress cards show a progress bar?
> **Domain:** No. Only **Feature Request / new development** cards. Break-fix style tickets skip it.
>
> **Dev:** If something carries five times, do we stack five tags?
> **Domain:** No. One **Carryover Tag** for the **Origin Cycle**.
>
> **Dev:** Walk-up printer jam already fixed — do we still email the user to Approve and Close?
> **Domain:** No. That is a **Quick Log**: Closed Ticket immediately, no confirm token.
>
> **Dev:** Someone reported the wrong department — do we close it or wipe it?
> **Domain:** **Hard Delete** from an IT session, after typing the ticket number. Closed Ticket keeps the record.

## Flagged ambiguities

- **“History”** here means Ticket History for reporting / cycle lineage — not only the per-ticket audit timeline inside the detail drawer.
- **Carryover** ≠ **Reopen** ≠ **Report Issue**.
- Board UI may keep **Resolved** and **Closed** in one rightmost column for now; domain meanings stay distinct.
- Success metrics may count Resolved and Closed together until a Resolved ticket is **Reopened** (then it is not a successful close).
- Work Cycle membership is deferred relative to first live-board wiring, but definitions above still apply.
- Token lifetime starts at **1 hour** per stage; revisit if field use says otherwise.
- **Quick Log** skips ADR 0004’s two-stage verify (see ADR 0005). Supervisor `QuickTicketApproval` is deferred.
