# ADR 0002: Intranet guest access and IT-only sign-in

## Status

Accepted (product intent — UI mock auth in place; API session not wired yet)

## Context

Most employees should report issues and follow work without creating accounts. Only IT staff need credentials. Accounts are provisioned by IT via User Management (no public registration). The app is expected to run on the corporate intranet.

## Decision

1. **Guest (no login)** can use:
   - Report Cases (ticket intake)
   - IT Workspace board in **read-only** mode (follow work; no claim / drag / edit)
   - IT Overview (IT Manager dashboard), including Excel / PDF export
2. **IT sign-in** is required for operational and admin work:
   - IT Workspace **write** actions
   - User Management
   - Data References
3. There is **no self-registration**. IT creates / edits / disables users in User Management.
4. Header UX:
   - Signed out → **IT Sign in** opens a login dialog
   - Signed in → avatar menu with **Edit profile** and **Log out**
5. User Management / Data References nav links are **hidden** until an IT session exists.

## Consequences

- Auth is IT-scoped, not a general employee SSO for browsing.
- Kanban must later enforce read-only for guests even if the URL is known.
- Deep links to `/users` and `/references` should eventually redirect or prompt IT login (nav already hides them for guests).

## Notes

Mock client session exists for UI; replace with real API auth later.
