# Spec: Live IT Workspace (Phase 1)

Status: ready-for-agent

Seam (confirmed): HTTP API for Board / Ticket lifecycle (single primary test seam).  
Domain: `CONTEXT.md`, ADR 0002, ADR 0004 (ADR 0003 superseded).

## Problem Statement

Employees can already report IT issues from the portal into the database, but the IT Workspace kanban still shows mock cards. Assignees cannot Claim real work, move a case to **Awaiting User Test**, or run the email deep-link verify path. Guests can open the board URL and currently could interact with mock writes. Managers cannot trust the board as the live queue.

## Solution

Wire the IT Workspace to real tickets. Guests may view the board (including requester identity) but cannot write in-app. Assignees with an IT session Claim work, update **Development Progress** on Feature Request cards, **Send for User Test**, and run **Approve and Close** / **Report Issue** / **Reopen** / **Resend** per ADR 0004. Requesters act through a **User Confirm Token** deep link that opens the board with that ticket’s drawer. Tests prove the lifecycle through the Board/Ticket HTTP API.

## User Stories

1. As a Guest, I want to open the IT Workspace and see real Board Cards from the database, so that I can follow IT workload without signing in.
2. As a Guest, I want to see requester name, email, and extension on cards/drawers, so that context is clear on the intranet board.
3. As a Guest, I want board write actions disabled in the app, so that I cannot Claim or change tickets without authority.
4. As a requester, I want my portal-reported ticket to appear on the board after submit, so that I know IT can see it.
5. As an IT Staff member, I want to sign in and Claim an unassigned backlog card, so that I become its Lead and start work.
6. As an IT Staff member, I want Claim to fail when a Lead already exists, so that work is not stolen silently.
7. As a Lead, I want to add Collaborators, so that teammates can help on the same card.
8. As an Assignee, I want to filter the board by assignee, category, and text search, so that I can find my work quickly.
9. As an Assignee, I want metric counts for backlog, in progress, Awaiting User Test, and the rightmost Resolved/Closed bucket, so that load is visible at a glance.
10. As an Assignee, I want a Refresh control (and reload on focus), so that I can see others’ changes without websockets.
11. As an Assignee on a Feature Request / new development ticket, I want a progress value from 0–100% on the in-progress card, so that others see movement.
12. As an Assignee on a Feature Request ticket, I want the drawer to let me set progress and write a note about what changed, so that updates are explained.
13. As an Assignee on a non-development ticket, I want no progress bar, so that break/fix work stays uncluttered.
14. As an Assignee, I want to **Send for User Test**, so that the ticket enters **Awaiting User Test** and the requester gets an email deep link.
15. As a requester, I want the email to contain a link (not in-email buttons), so that I land on the board with the ticket drawer open.
16. As a requester holding a valid Awaiting User Test token, I want to **Approve and Close**, so that the ticket becomes **Resolved**.
17. As a requester holding a valid Awaiting User Test token, I want to **Report Issue** with a required reason and optional evidence, so that IT continues work without calling it Reopen.
18. As an Assignee, I want to **Approve and Close** during Awaiting User Test without waiting for Resend, so that we are not overly strict when the user already confirmed orally.
19. As an auditor, I want Approve and Close to record whether the actor was the requester (token) or an Assignee, so that responsibility is clear later.
20. As an Assignee, I want a Resend action that invalidates the previous token and sends a new link, so that lost emails can be recovered.
21. As an Assignee, I want a notification when an Awaiting User Test token expires unused while the ticket stays in that stage, so that I can nudge the user or Approve myself.
22. As the system, I want Awaiting User Test token expiry **not** to create a Closed Ticket, so that silence never implies the fix worked.
23. As a requester or Assignee, after Approve and Close I want a Resolved-stage email/token whose only requester action is **Reopen**, so that there is a cooling window before terminal close.
24. As a requester or Assignee, I want Reopen (Resolved only) to require a reason and allow evidence, with an audited actor, so that returns to work are intentional.
25. As the system, when the Resolved-stage token expires without Reopen, I want the ticket to become a **Closed Ticket** automatically, so that finished work reaches a terminal state.
26. As a reporting consumer, I want Resolved and Closed to be countable as success unless a Resolved ticket was Reopened, so that dashboard success stays honest.
27. As a Guest with only a token link, I want to perform only the stage-allowed actions in the drawer and otherwise remain read-only, so that token scope stays minimal.
28. As an IT Manager, I want Guests blocked from User Management and Data References as today, so that admin tools stay IT-only.
29. As a developer, I want status/column mapping aligned to backlog, in progress, Awaiting User Test, and a shared rightmost Resolved+Closed column, so that UI matches domain language even if the rightmost label stays temporarily confusing.
30. As an Assignee, I want attachments from the portal report visible on the ticket detail, so that I can diagnose with screenshots.
31. As the system, I want token lifetime of one hour per stage (Awaiting User Test and Resolved), so that links do not live forever.
32. As product, I want Quick Log, Work Cycle cron, drag-and-drop, group view, advanced filters, and websocket realtime out of this phase, so that the live board ships without scope creep.

## Implementation Decisions

1. **Primary delivery shape**: Hybrid phase 1 Live Board — real tickets + real email tokens now; Work Cycle membership later (ADR 0001 remains future work).
2. **AuthZ**: Board reads are public to intranet Guests; all board writes require IT JWT except requester actions authorized by a valid User Confirm Token. Respect ADR 0002.
3. **Column mapping**:
   - backlog → open work with no Lead
   - in_progress → active IT work (including after Report Issue / Reopen)
   - pending_user → **Awaiting User Test**
   - rightmost UI column → **Resolved** and **Closed** together (label may stay historically “resolved”)
4. **Status model**: Align persistence so Awaiting User Test is not overloaded with unrelated approval meanings (replace or reinterpret legacy `PENDING_APPROVAL` as needed). Keep **Resolved** and **Closed** as distinct domain states.
5. **Assignee roles**: Persist Lead vs Collaborator. First successful Claim creates Lead. Claim cannot steal a card that already has a Lead.
6. **Send for User Test**: Assignee action from active work → Awaiting User Test + email deep link (board + drawer for that ticket). No action buttons inside the email body.
7. **Approve and Close**: Visible only in Awaiting User Test. Allowed actors: requester via token **or** any Assignee. Always audit actor. Transition → Resolved and **always** send Resolved-stage reopen token email.
8. **Report Issue**: Awaiting User Test only; required reason; optional evidence; returns to active IT work; not named Reopen.
9. **Reopen**: Resolved only; requester via token or Assignee; required reason; optional evidence; audit actor; clears successful-close counting for that Resolved attempt.
10. **Token expiry**:
    - Awaiting User Test: ticket stays; notify Assignees; Assignees may Resend and/or Approve and Close immediately
    - Resolved: unused expiry → Closed Ticket automatically
11. **Resend**: Assignees only; previous token invalidated immediately; new 1-hour token.
12. **Token TTL**: 1 hour for both stages.
13. **Development Progress**: Only Feature Request / new development tickets (`feature_request` / `FEATURE_REQUEST`). Store 0–100% and allow drawer updates that include a note of what changed; show bar on in-progress cards for that category only.
14. **Mailer**: Real send in this phase; tests mock at the mail port/adapter boundary while still asserting “send requested” through the HTTP seam.
15. **Deep link**: Token resolves to localized IT Workspace with the ticket drawer open; capability limited to stage-allowed actions.
16. **Refresh**: Manual refresh + reload on focus; no websocket requirement.
17. **API surface** (conceptual): board list/detail; claim; manage collaborators; send-for-user-test; approve-and-close; report-issue; reopen; resend; progress update; token resolve/consume. Prefer extending the tickets application module rather than inventing a parallel bounded context.
18. **Audit**: Use durable audit/event records for Approve and Close and Reopen actors (and preferably Send for User Test / Report Issue / Resend).
19. **UI modules**: Replace mock-driven kanban workspace/drawer data with API clients; keep layout; Feature Request drawer variant for progress notes; gate writes on IT session vs token.
20. **Testing seam (confirmed)**: Single primary seam = **HTTP Board/Ticket lifecycle API**. Do not make Prisma or React unit tests the source of truth for domain rules.

## Testing Decisions

1. Good tests assert **external behavior** through the HTTP Board/Ticket API (status transitions, permissions, token rules, audit actor, progress category rules)—not private functions or UI internals.
2. Prefer request/response tests against the API app with a test database (or project-equivalent), mocking only the mail adapter.
3. Cover at minimum: portal-created ticket appears on board list; Claim Lead rules; Send for User Test issues token + mail request; Approve and Close by token vs Assignee both audited; Report Issue vs Reopen naming/stage guards; Awaiting User Test expiry stays put; Resolved expiry closes; Resend rotates tokens; progress update allowed only for Feature Request; Guest JWT-less write attempts fail; token deep-link action scope.
4. Prior art: the repo currently lacks a mature automated test suite for tickets; establish API-level tests as the first canonical pattern for this feature rather than component snapshot tests.
5. Optional later smoke (not the primary seam): browser open of token link — only if needed after API is green.

## Out of Scope

- Quick Log / `QUICK_TICKET` approval UX
- Work Cycle Close cron, Carryover tags, Origin Cycle membership
- Drag-and-drop column moves
- Group view and advanced filter panel
- Websocket/realtime push
- Reworking IT Overview dashboard beyond consuming success rules later
- Changing portal report intake beyond ensuring tickets remain board-visible

## Further Notes

- Glossary terms to prefer: **Board Card**, **Awaiting User Test**, **Resolved**, **Closed Ticket**, **Approve and Close**, **Report Issue**, **Reopen**, **User Confirm Token**, **Lead**, **Collaborator**, **Claim**, **Send for User Test**, **Development Progress**, **Guest**, **IT session**.
- Avoid: calling Report Issue “Reopen”; treating Resolved as terminal; auto-closing on Awaiting User Test token expiry; progress bars on non-development tickets.
- Rightmost column UX label debt is accepted temporarily (grill Q9 = B).
- Phase brief companion: `application-docs/it-workspace-phase1-brief.md`.
