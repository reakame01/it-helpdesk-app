# IT Helpdesk Monorepo

Production-ready Turborepo + pnpm workspace for an Internal IT Helpdesk application.

## Structure

```
apps/
  api/          NestJS + Prisma (PostgreSQL) — port 4000
  web/          Next.js 14 App Router — port 3000
packages/
  types/              Shared enums, DTOs, interfaces
  config-typescript/  Shared tsconfig presets
  config-eslint/      Shared ESLint configs
application-docs/     Architecture notes, ER diagrams, PR template
docs/adr/             Architecture Decision Records
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (for PostgreSQL)

## Setup

```bash
# Install dependencies
pnpm install

# Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Start PostgreSQL in Docker
pnpm db:up

# Generate Prisma client, apply migrations, seed data
pnpm db:generate
pnpm --filter api exec prisma migrate deploy
pnpm db:seed

# Start both apps
pnpm dev
```

> **Local alternative:** `pnpm db:push` still works for quick schema sync, but prefer **migrations** so environments stay consistent. Migration files live in `apps/api/prisma/migrations/`.

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Health: http://localhost:4000/api/health
- Postgres: `localhost:5433` (user/pass/db: `postgres` / `postgres` / `helpdesk`)

### Dev login (seed)

| Email | Password | Role |
|-------|----------|------|
| `it@company.com` | `it1234` | IT_STAFF |

Managed login roles (highest → lowest): **GM** → **SUPERVISOR** → **IT_STAFF**.

Seed also creates additional IT Staff / Supervisor / GM sample accounts (same password `it1234`) plus Data References catalogs (`departments`, `categories`, `skills`).

## Auth & API (current)

- Web IT login calls `POST /api/auth/login` and stores a **JWT** for subsequent requests.
- **Data References** and **User Management** frontends are wired to the real API (no page mocks).
- Mutating reference/user endpoints require `Authorization: Bearer <token>`.

### Useful endpoints

| Area | Methods |
|------|---------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| References | `GET /api/references/catalogs`, `GET|POST /api/references/:catalogCode/items`, `PATCH|DELETE /api/references/items/:id` |
| Users | `GET|POST /api/users`, `PATCH /api/users/:id`, `POST /api/users/:id/reset-password` |

API feature modules (References, Users) follow a **clean architecture** layout under `apps/api/src/<feature>/` (`domain` → `application` → `infrastructure`).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Build shared types, then run api + web via concurrently |
| `pnpm dev:turbo` | Same via Turborepo pipelines |
| `pnpm build` | Build all packages/apps |
| `pnpm lint` | Lint all workspaces |
| `pnpm db:up` | Start PostgreSQL via Docker Compose |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:logs` | Tail PostgreSQL logs |
| `pnpm db:generate` | Prisma generate |
| `pnpm db:push` | Prisma db push (dev sync; prefer migrate for shared envs) |
| `pnpm db:seed` | Seed IT users + reference catalogs |
| `pnpm db:studio` | Prisma Studio |

API-only:

```bash
pnpm --filter api db:migrate   # prisma migrate dev
pnpm --filter api exec prisma migrate deploy
```
