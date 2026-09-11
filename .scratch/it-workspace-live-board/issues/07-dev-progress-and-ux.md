# 07: Development Progress + board write UX polish

**What to build:** Feature Request / new development tickets show a 0–100% progress bar while in progress; Assignees update progress with a note in the drawer. Non-development tickets have no progress UI. Refresh works; Guests cannot trigger write controls in the app.

**Blocked by:** 02 — Claim with Lead

**Status:** resolved

- [x] Progress update API accepts 0–100 + note only for Feature Request category
- [x] In-progress cards show progress only for Feature Request
- [x] Drawer exposes progress editor for Assignees on those tickets
- [x] Guest write controls remain disabled in UI
- [x] Manual refresh reloads board data
- [x] API seam tests cover category guard for progress

## Answer

`PATCH /tickets/:id/progress` guarded to Feature Request + assignee. Board mapping/UI hide progress elsewhere. Refresh button + focus reload remain; Guests only get token-driven stage actions.
