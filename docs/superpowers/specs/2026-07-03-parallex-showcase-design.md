# parallex-showcase — Design Spec

**Date:** 2026-07-03
**Status:** Awaiting user review
**Codename:** `parallex-showcase`
**Purpose:** Portfolio-grade proptech SaaS demo, scoped to map 1:1 onto Parallex's Senior Full-Stack Engineer JD (getparallex.com). Ships as a live Vercel deploy + public GitHub repo + 5-min Loom walkthrough, sent to amer@getparallex.com.

## 1. Goal & Success Criteria

Build a production-grade, OSS-quality Next.js 15 SaaS application themed around Parallex's product (interactive sales hubs for real estate developers and brokers). The build must demonstrate every bullet in the JD:

- Major feature ownership end-to-end (planning → release)
- Customer-facing flows + admin tools + dashboards + internal workflows
- Frontend + backend + APIs + server actions + permissions-aware UI
- Edge cases, empty/error/loading states, permissions
- Testing discipline on critical flows
- Clean technical planning, decomposition, delivery steps

**Success = a Sr. Engineer reviewer at Parallex can verify, in 10 minutes of clicking + reading the README, that the candidate meets every JD requirement.**

### Out of scope

- Payments / billing
- Email notifications beyond Auth.js magic links
- Multi-tenant org isolation (single-tenant demo)
- Native mobile apps (responsive web only)
- Buyer-side authentication (buyers are anonymous, tracked by session)

## 2. Stack (locked)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) | JD-explicit ("modern Next.js") |
| Language | TypeScript strict | JD-explicit; no `as any`/`@ts-ignore` ever |
| Styling | Tailwind v4 | Project standard |
| Components | shadcn/ui (Radix + Tailwind) | Industry standard, accessible, customizable |
| ORM | Drizzle | Type-safe, lightweight, schema-as-code |
| DB | Postgres on Neon (serverless, branching) | Enterprise signal, free tier, preview branches |
| Auth | Auth.js v5 (NextAuth) — GitHub OAuth + magic link | RBAC sessions, one-click demo login |
| Validation | Zod | Type-safe schemas shared client/server |
| Data fetching | TanStack Query (client) + RSC (server) | Standard pattern |
| Tables | TanStack Table v8 | JD calls out "complex tables, filters" |
| Charts | Recharts | Engagement analytics |
| File storage | Vercel Blob | Next.js native, 1GB free |
| Unit tests | Vitest + Testing Library | Fast, modern |
| API mocking | MSW | Server Action mocks in component tests |
| E2E | Playwright | The killer-flow test |
| Hosting | Vercel | Next.js native, preview deploys per PR |
| AI (optional) | OpenAI API (gpt-4o-mini vision + text) | Graceful degradation if no key |
| CI | GitHub Actions | typecheck + lint + unit + e2e on every PR |

## 3. Architecture — Modular Monolith

One Next.js app, strict domain modules. Each module owns schema + server actions + UI routes + tests. Cross-module access via explicitly exported service functions only.

```
src/
  modules/
    auth/        → Auth.js v5 config, sessions, RBAC role checks
    project/     → Project CRUD, team membership, slug routing
    asset/       → Asset upload, tagging (AI + manual), publish workflow
    analytics/   → Engagement events, intent scoring, dashboards
    workflow/    → Approval requests, audit log, share-link permissions
  lib/
    authz.ts     → assertCan(actor, action, resource) — single authz entry
    db.ts        → Drizzle client
    result.ts    → Result<T, E> type + helpers
    ai.ts        → OpenAI client (lazy, key-optional)
  app/
    (auth)/      → login, signup, magic-link callback
    dashboard/   → developer surface (auth required + developer role)
    admin/       → admin surface (auth required + admin role)
    broker/      → broker surface (auth required + broker role)
    projects/[slug]/  → public hub
    s/[token]/   → broker share-link entry
    api/
      search/    → NL search endpoint
      ai/        → AI feature endpoints
  middleware.ts  → route-level RBAC redirects
```

## 4. Domain Model

### Tables

- `users` — id, email, name, role[admin|developer|broker], image_url, timestamps
- `projects` — id, developer_id→users, slug(unique), name, description, location, status[draft|published], hero_image_url, timestamps
- `project_members` — project_id, user_id, role_in_project (for multi-member projects)
- `assets` — id, project_id, type[render|film|floorplan|brochure|unit], title, url, thumbnail_url, metadata(jsonb), status[draft|pending|approved|published], ai_tags(text[]), timestamps
- `units` — id, project_id, code, name, beds, baths, area_sqft, price, status[available|reserved|sold], floor_number
- `share_links` — id, project_id, broker_id→users, token(unique), expires_at, max_uses, current_uses, requires_password, timestamps
- `engagement_events` — id, project_id, asset_id?, share_link_id?, session_id, event_type[view|heartbeat|click|inquire|save], metadata(jsonb), created_at (high-write, index on project_id+created_at; partition-ready)
- `audit_logs` — id, actor_id→users, action, entity_type, entity_id, before(jsonb), after(jsonb), created_at
- `approval_requests` — id, asset_id, requested_by→users, status[pending|approved|rejected], decided_by?, decided_at?, note, timestamps
- Auth.js v5: accounts, sessions, verification_tokens (per the official adapter schema)

### RBAC

Three roles: **Admin** (manage users, all projects, audit log), **Developer** (own projects + assets + analytics, approve publishes, invite brokers), **Broker** (browse projects, generate scoped share-links, see own engagement only). Anonymous visitors access public hub + share-link entries only.

Enforced at three layers:
1. **Middleware** — coarse route-level redirects (`/admin/*` → admin only, etc.)
2. **Layout guards** — per-segment `getCurrentUser()` + role check, server-side
3. **Server Actions** — every action calls `assertCan(actor, action, resource)`; resource ownership re-checked (developer can only edit own projects)

UI adapts to role (broker never sees analytics tabs, developer never sees user management). UI hiding is convenience; server enforcement is security.

## 5. Server Action Contract

Every mutation flows through a Server Action with this exact shape:

```ts
export async function createProject(
  input: CreateProjectInput
): Promise<Result<Project, ActionError>> {
  // 1. z.parse(input) — Zod validation
  // 2. const user = await getCurrentUser() — server session
  // 3. assertCan(user, "project:create", { developerId: user.id }) — RBAC
  // 4. const project = await db.insert(...) — Drizzle mutation
  // 5. await auditLog({ actor: user, action: "project:create", entity: project })
  // 6. revalidatePath("/dashboard/projects")
  // 7. return ok(project)
}
```

- All actions return `Result<T, E>` — typed success/failure, never throw across the wire
- All inputs Zod-validated server-side (never trust client)
- All mutations write to audit log
- All actions defense-in-depth (UI hiding + server re-check)

## 6. Real-Time Engagement Tracking

- Hub page emits events via debounced Server Actions: page view (on mount), asset view (IntersectionObserver), heartbeat every 10s while asset is in view, inquiry click, save action.
- Server Action writes row to `engagement_events` with session_id (cookie-set on first hub visit).
- Dashboard polls `/dashboard/analytics` data via TanStack Query every 30s — gives "live" feel.
- Phase 3 stretch goal: Server-Sent Events for true real-time (not required for portfolio).

## 7. AI Features (graceful degradation)

All AI is server-side, keys in env. If `OPENAI_API_KEY` is unset, features silently hide and the app remains fully functional.

- **Auto-tagging** — on asset upload, queue vision call to `gpt-4o-mini`; populate `ai_tags` text array.
- **Natural-language search** — `/api/search?q=` translates query to Drizzle filter via LLM function-calling.
- **Intent scoring** — nightly batch job (or on-demand) computes a weighted heuristic score per session from event pattern (e.g., 3× save, 2× inquire, 1.5× click, 0.1× heartbeat) → `intent_score` 0–100. Not ML training — transparent, debuggable weights.
- **Description generation** — Developer clicks "Generate description" on a project → LLM fills draft → user edits before save.

## 8. Surfaces & Routes

| Surface | Routes | Role | Key features |
|---|---|---|---|
| Auth | `/login`, `/signup`, `/magic-link` | anonymous | GitHub OAuth + magic link |
| Admin | `/admin/users`, `/admin/audit`, `/admin/settings` | admin | User CRUD, audit log w/ diffs, system settings |
| Developer dashboard | `/dashboard/projects`, `/dashboard/projects/[id]`, `/dashboard/analytics` | developer | Project CRUD, asset upload, units, engagement analytics |
| Public hub | `/projects/[slug]` | anonymous | Cinematic asset presentation, units grid, inquiries |
| Broker share-link | `/s/[token]` | anonymous + token | Scoped entry, password gate if set, expiry enforced |
| Broker workspace | `/broker/projects`, `/broker/share-links` | broker | Browse projects, generate share-links, see own engagement |

## 9. Testing Strategy

- **Vitest + Testing Library** — unit tests for business logic (RBAC checks in `lib/authz.ts`, validation, intent scoring in `lib/intent.ts`).
- **MSW** — mock Server Actions / fetches in component tests.
- **Playwright** — e2e covering the killer flow: *login → create project → upload asset → request approval → admin approves → broker generates share-link → anonymous opens share-link → analytics dashboard shows the hit*. This single test proves the entire vertical.
- **Coverage target**: 80%+ on `src/modules/*/actions.ts`, `src/lib/authz.ts`, `src/lib/intent.ts`.
- **CI**: GitHub Actions runs `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:e2e` on every PR; main branch auto-deploys to Vercel.

## 10. Phasing (ralph-loop milestones)

| # | Phase | Outcome | Est. | Definition of done |
|---|---|---|---|---|
| 0 | Foundation | Next.js 15 + Drizzle + Auth.js + RBAC middleware + deploy to Vercel | 1–2d | `pnpm dev` runs, login works, deploy URL live |
| 1 | Developer Dashboard MVP | Project CRUD, asset upload (Blob), units, basic counters | 3–4d | Developer can CRUD projects/assets/units end-to-end |
| 2 | Public Hub + Broker | Cinematic hub, broker workspace, share-links, engagement tracking wired | 3–4d | Anonymous can view hub; share-links enforce permissions |
| 3 | Admin + RBAC + Workflow | User mgmt, approval flow, audit log w/ diffs, full RBAC enforcement | 3–4d | Approval workflow blocks unpublished assets; audit log captures every mutation |
| 4 | Analytics + Real-time | Engagement dashboard, intent scoring, charts | 3–4d | Dashboard updates within 30s of hub activity |
| 5 | AI Features | Vision tagging, NL search, intent heuristic, description gen | 3–4d | With API key: all AI features work. Without: gracefully hidden |
| 6 | Polish + Ship | Cinematic polish, full test coverage, README, seed data, Loom | 2–3d | Loom recorded; email drafted; GitHub repo public |

**Total estimate: 18–25 days.** Honest. ralph-loop tracks each phase as iteration boundaries.

## 11. Dependencies on User

Required before Phase 0 deploy:
1. **Neon account** + connection string (5 min, free)
2. **Vercel account** (5 min, free)
3. **GitHub OAuth app credentials** — client ID + secret (10 min, free)

Required only for Phase 5 AI:
4. **OpenAI API key** (optional — graceful skip without)

## 12. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scope creep ("just add X") | High | Strict phase boundaries; new ideas → backlog, not current phase |
| Time estimate overrun | Medium | Phase 0 + 1 ship standalone; subsequent phases additive |
| Auth.js v5 churn (still beta-ish) | Medium | Pin version; lock the adapter pattern; have email fallback |
| Vercel Blob quota (1GB) | Low | Compress images on upload; warn at 80% |
| OpenAI key not provided | High | All AI features degrade gracefully — Phase 5 ships hidden if needed |
| 18–25d is longer than expected attention span | Medium | Each phase is independently demo-able; can stop at any phase boundary with a working portfolio piece |

## 13. Definition of Done (overall)

- All 6 phases complete OR an explicit phase boundary chosen as ship target
- Live Vercel URL responds with the killer flow working end-to-end
- GitHub repo is public with README explaining the JD mapping
- Playwright e2e passes on the live deploy
- 5-minute Loom walkthrough recorded
- Email drafted to amer@getparallex.com with URL + repo + Loom link
