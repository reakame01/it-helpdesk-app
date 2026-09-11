# ADR 0006: Hard Delete for wrong-entry tickets

A **Closed Ticket** keeps history. Wrong reports still need a way off the board without touching the database by hand.

## Status

Accepted

## Decision

An **IT session** may **Hard Delete** a ticket after typing its ticket number. That purge removes the Board Card and related records (worklogs, attachments, tokens, assignees, ticket-scoped audit). Guests cannot. One remaining `HARD_DELETE` audit names who purged which ticket number.

## Why

- Rejected “just Close it”: Closed is a successful finish, not a data-entry mistake.
- Rejected unguarded delete: one confirmation field matching the ticket number is enough friction for an irreversible wipe.
- Rejected Supervisor-only: any signed-in IT operator can clean a wrong card; that matches “login required.”
