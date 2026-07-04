# parallex-showcase

Production-grade proptech SaaS demo built to demonstrate fit for the Senior Full-Stack Engineer role at [Parallex](https://getparallex.com).

## Stack

- **Next.js 15** App Router + Server Components + Server Actions
- **TypeScript** strict mode with `noUncheckedIndexedAccess` (no `as any` / `@ts-ignore`)
- **Tailwind v4** + **shadcn/ui** (Base UI primitives)
- **Drizzle ORM** + Postgres on Neon (serverless, HTTP transport)
- **Auth.js v5** with GitHub OAuth + RBAC (admin / developer / broker)
- **Zod** validation, **TanStack Query/Table**, **Recharts**
- **Vitest** unit + **Playwright** e2e + **GitHub Actions** CI

## Architecture

Modular monolith. Each domain (`project`, `asset`, `analytics`, `auth`, `workflow`) owns its schema + server actions + UI routes + tests under `src/modules/<name>/`. RBAC enforced at middleware (route redirects) AND inside every Server Action (defense in depth).

### RBAC model

| Role      | Capabilities                                                         |
| --------- | -------------------------------------------------------------------- |
| Admin     | Manage users, all projects, audit log, system settings               |
| Developer | Own projects + assets + analytics, approve publishes, invite brokers |
| Broker    | Browse projects, generate scoped share-links, see own engagement     |

Roles are checked at three layers:

1. **Middleware** (`src/middleware.ts`) — coarse route-level redirects
2. **Layout guards** (`src/app/(protected)/*/layout.tsx`) — per-segment role check
3. **Server Actions** — every action calls `assertCan(actor, action, resource)`

## Local setup

```bash
pnpm install
cp .env.example .env.local  # fill in real values
pnpm db:push                # sync schema to Neon
pnpm dev
```

## Required env vars

| Variable             | Purpose                                |
| -------------------- | -------------------------------------- |
| `DATABASE_URL`       | Neon Postgres connection string        |
| `AUTH_SECRET`        | Run `openssl rand -hex 32`             |
| `AUTH_GITHUB_ID`     | GitHub OAuth App Client ID             |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret         |
| `AUTH_TRUST_HOST`    | Set to `true` for Vercel/proxy deploys |

## Scripts

| Command             | What it does                |
| ------------------- | --------------------------- |
| `pnpm dev`          | Local dev server            |
| `pnpm build`        | Production build            |
| `pnpm tsc --noEmit` | Typecheck (strict)          |
| `pnpm test:unit`    | Vitest unit tests           |
| `pnpm test:e2e`     | Playwright e2e tests        |
| `pnpm db:push`      | Push schema changes to Neon |

## Phase status

All 7 phases implemented and deployed:

- **Phase 0** ✅ Foundation — Next.js 15 + Drizzle + Auth.js v5 (GitHub + Google OAuth) + RBAC + Vercel deploy
- **Phase 1** ✅ Developer Dashboard MVP — Project CRUD, asset management, unit management
- **Phase 2** ✅ Public Hub + Broker — Cinematic dark hub page, broker workspace, share-links, engagement tracking
- **Phase 3** ✅ Admin + RBAC — User management (role editing), audit log with every mutation captured
- **Phase 4** ✅ Analytics — Engagement dashboard with Recharts (pie/bar), event tracking, intent scoring
- **Phase 5** ✅ AI Infrastructure — Vision tagging + description generation (graceful degradation without API key)
- **Phase 6** ✅ Polish + Seed — Demo data seeding, full RBAC enforcement, cinematic hub UI

## JD mapping

Every bullet in the Parallex Senior Full-Stack Engineer JD maps to this codebase:

| JD requirement                                                    | Where it's demonstrated                               |
| ----------------------------------------------------------------- | ----------------------------------------------------- |
| Own major features end-to-end                                     | Phase-by-phase delivery with plans + commits          |
| Customer-facing flows + admin tools + dashboards                  | Public hub + admin console + developer dashboard      |
| Frontend + backend + APIs + server actions + permissions-aware UI | Server Actions, RBAC middleware, role-guarded layouts |
| Edge cases, empty/error/loading states                            | Phase 1+ (empty states), Phase 3 (error handling)     |
| Testing discipline                                                | Vitest + Playwright + GitHub Actions CI               |
| Clear technical plans                                             | `docs/superpowers/specs/` + `docs/superpowers/plans/` |
