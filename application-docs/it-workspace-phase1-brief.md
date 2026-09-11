# Phase 1 — Live IT Board (implementation brief)

Status: **Ready to implement when you say start** · Grilling closed 2026-09-10  
Sources: `CONTEXT.md`, `docs/adr/0004-two-stage-user-verify-and-resolved-window.md`, grill Q1–Q28

## Goal

Replace kanban mock data with real tickets so portal-reported cases appear on `/[locale]/it`, with IT write actions guarded, and the two-stage email verify path working for real.

## In scope

1. **Board read** — list tickets that are not out of active ops per mapping below; guest can view (full requester identity); metrics/filters basic (assignee, text, category).
2. **AuthZ** — guest read-only in app; IT JWT required for writes; token deep link for requester stage actions.
3. **Claim** — backlog → in progress; first claim = **Lead**; no claim-steal if Lead exists.
4. **Lead / Collaborator** — persist assignee role in DB.
5. **Send for User Test** — in progress → **Awaiting User Test** + email deep link (board + drawer).
6. **Approve and Close** — only in Awaiting User Test; User (token) **or** Assignee; audit actor → **Resolved** + always email Resolved-stage reopen token.
7. **Report Issue** — Awaiting User Test only; reason required; optional attachment; back to active work.
8. **Reopen** — Resolved only; User (token) or Assignee; reason + optional evidence; audit actor; success metric rules.
9. **Token expiry** — Awaiting User Test: stay put + notify assignees; Resolved: auto **Closed**.
10. **Resend** — assignees; invalidate previous token.
11. **Feature Request / Development only** — progress 0–100% on in-progress cards + drawer control with note on each progress update.
12. **Refresh** — manual / focus reload (no websocket).
13. **Hide** generic progress on non-development tickets; **no** drag-and-drop; **no** Quick Log (deferred).

## Out of scope (later)

- Quick Log  
- Work Cycle / carryover cron  
- Group view / advanced filters  
- Realtime push  

## Column mapping (phase 1)

| UI column | Domain / DB direction |
|-----------|------------------------|
| backlog | Open, no Lead |
| in_progress | Active IT work (incl. after Report Issue / Reopen) |
| pending_user | **Awaiting User Test** |
| rightmost (label may stay “resolved”) | **Resolved** + **Closed** together |

Add/adjust Prisma statuses as needed so Awaiting User Test is not overloaded with unrelated “approval” meanings.

## Primary flows

```text
Report (portal) → Backlog → Claim (Lead)
  → In progress [+ Dev Progress if Feature Request]
  → Send for User Test (+ email link)
  → Awaiting User Test
        ├ Approve and Close (User|Assignee, audited) → Resolved (+ reopen email)
        │     ├ Reopen (User|Assignee, audited) → In progress
        │     └ token expiry → Closed
        └ Report Issue → In progress
```

## Engineering checklist (when coding starts)

- [ ] Schema: assignee role; progress (+ progress notes/events); token table; audit/close actor; status enum alignment  
- [ ] API: board list/detail; claim; assignees; send-for-test; approve-close; report-issue; reopen; resend; progress update; mailer  
- [ ] Web: wire `KanbanWorkspace` / drawer; guest vs IT vs token capabilities; Feature Request drawer variant  
- [ ] Deep link route: token → `/it` + open drawer for ticket  
- [ ] Tests/smoke: report → visible on board → claim → send-for-test → approve → resolved → expiry/reopen  

## Open only if blocked while coding

Confirm Feature Request detection = existing `feature_request` / `FEATURE_REQUEST` category (no new category taxonomy in phase 1).
