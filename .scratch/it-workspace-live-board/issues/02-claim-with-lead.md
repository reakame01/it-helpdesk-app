# 02: Claim with Lead — IT takes backlog work

**What to build:** A signed-in Assignee can Claim an unassigned backlog card, become its Lead, and see it move to in progress. Claim fails if a Lead already exists. Board write endpoints require an IT session.

**Blocked by:** 01 — Live board read

**Status:** resolved

- [x] Claim HTTP action assigns Lead and moves card to active work
- [x] Second Claim on a led card is rejected
- [x] Collaborator can be added without replacing Lead
- [x] Unauthenticated Claim is rejected
- [x] UI Claim button works for IT session and is disabled for Guests
- [x] API seam tests cover Claim success/failure rules

## Comments

Previous `resolved` / Answer described a ship that was reverted. Re-implemented in the current tree.

## Answer

`POST /api/tickets/:id/claim` (JWT IT) creates Lead + `IN_PROGRESS`. A second Claim is 409 when a Lead exists. `POST /api/tickets/:id/collaborators` adds a Collaborator without replacing Lead. Guest Claim is disabled in the UI; unauthenticated HTTP Claim is 401. Claim/collaborator rules are in `ticket-lifecycle.rules.ts` and covered by node:test.

**Verify:** sign in as IT, Claim a backlog card, confirm it moves to in progress; Claim again → conflict. Guest sees the Claim control disabled.
