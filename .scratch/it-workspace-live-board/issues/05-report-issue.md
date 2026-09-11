# 05: Report Issue — return to active work

**What to build:** During Awaiting User Test, the requester (token) can Report Issue with a required reason and optional evidence, returning the card to active IT work without calling it Reopen.

**Blocked by:** 03 — Send for User Test

**Status:** resolved

- [x] Report Issue requires reason; optional evidence supported
- [x] Ticket returns to in progress / active work
- [x] Action rejected outside Awaiting User Test
- [x] UI/copy uses Report Issue (not Reopen) in this stage
- [x] API seam tests cover success and stage guard

## Comments

Previous `resolved` / Answer described a ship that was reverted. Re-implemented in the current tree.

## Answer

Public `POST /tickets/:id/report-issue-token` (reason required, optional JPEG/PNG) consumes the Awaiting User Test token and sets `IN_PROGRESS`. Copy is Report Issue / แจ้งเพิ่ม — not Reopen. Assignees do not get this action; they Approve, Resend, or keep working after the requester reports.

**Verify:** From a valid Awaiting User Test link, Report Issue with a reason; the card returns to in progress. Empty reason is rejected. Resolved-stage token cannot Report Issue.
