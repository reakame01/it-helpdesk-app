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

## Answer

`POST /tickets/:id/claim` (JWT IT) creates Lead + `IN_PROGRESS`. `POST /tickets/:id/collaborators` adds Collaborator when Lead exists. Pure rules in `ticket-lifecycle.rules` covered by node:test. Kanban Claim calls the API for signed-in IT only.
