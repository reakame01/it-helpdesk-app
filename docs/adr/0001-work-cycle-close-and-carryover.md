# ADR 0001: Two-week Work Cycle close and carryover

## Status

Accepted (product intent — not implemented yet)

## Context

The IT kanban is labeled by Work Cycle (e.g. “รอบงานที่ 12”). We need a clear rule for what happens to cards when a cycle ends, so the board stays focused on current work while dashboard metrics still have completed work to measure.

## Decision

1. A **Work Cycle** lasts **2 weeks**. **Work Cycle Close** runs **automatically** (cron job).
2. A ticket is **finished** only when it is a **Closed Ticket**: IT done **and user confirmed**.
3. On close, Closed Tickets are **removed from the active board** into **Ticket History** for dashboard calculation and later review.
4. Cards that are **not** Closed Tickets are **Carryover** into the next Work Cycle.
5. **Carryover Tag** shows only the **Origin Cycle** (first cycle the card entered). Do **not** accumulate one tag per carryover; comparing origin to the current cycle already shows how many cycles it has lingered.
6. On **Reopen**, the live board card belongs to the **cycle when reopen occurs**. Ticket History still keeps prior cycle membership / origin so we know where the case came from before reopen.
7. IT Manager reporting uses **Report Range**: Work Cycle, calendar **month**, or calendar **year**. Month/year aggregate Ticket History across included cycles and support **one export** for that range, plus an optional per-cycle breakdown — IT Manager does not manually merge cycle exports.

## Consequences

- Close must be a scheduled job, not a manual “end sprint” button (ops may still want a manual trigger later for emergencies — not required by this ADR).
- “Pending user confirm” must not be treated as Closed at cutover.
- Dashboard / IT Overview views should read completed work primarily from Ticket History (and cycle boundaries).
- Board UI shows at most one origin Carryover Tag; detailed lineage lives in Ticket History.
- Reopen creates current-cycle work without erasing historical cycle context.

## Notes

Refined from follow-up product discussion; UI/API not built yet.
