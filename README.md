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

# Generate Prisma client & push schema
pnpm db:generate
pnpm db:push

# Start both apps
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Health: http://localhost:4000/api/health
- Postgres: `localhost:5433` (user/pass/db: `postgres` / `postgres` / `helpdesk`)

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
| `pnpm db:push` | Prisma db push |
| `pnpm db:studio` | Prisma Studio |
