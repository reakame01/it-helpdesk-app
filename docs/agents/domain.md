# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root
- **`docs/adr/`**: read ADRs that touch the area you're about to work in

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

This repo is treated as **single-context** (one glossary), even though the codebase is a pnpm monorepo of apps/packages:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-work-cycle-close-and-carryover.md
│   ├── 0002-intranet-guest-and-it-signin.md
│   ├── 0003-email-token-close-and-reopen.md   ← superseded
│   └── 0004-two-stage-user-verify-and-resolved-window.md
├── apps/
│   ├── api/
│   └── web/
└── packages/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0004 (two-stage verify), but worth reopening because…_
