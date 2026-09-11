# 05: Report Issue — return to active work

**What to build:** During Awaiting User Test, the requester (token) can Report Issue with a required reason and optional evidence, returning the card to active IT work without calling it Reopen.

**Blocked by:** 03 — Send for User Test

**Status:** resolved

- [x] Report Issue requires reason; optional evidence supported
- [x] Ticket returns to in progress / active work
- [x] Action rejected outside Awaiting User Test
- [x] UI/copy uses Report Issue (not Reopen) in this stage
- [x] API seam tests cover success and stage guard

## Answer

`report-issue` / `report-issue-token` require reason, invalidate awaiting token, set `IN_PROGRESS`, write worklog. UI label is Report Issue / แจ้งเพิ่ม.
