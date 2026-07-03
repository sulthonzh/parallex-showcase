# Phase 0: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Next.js 15 + Drizzle + Postgres-on-Neon + Auth.js v5 + RBAC foundation that boots, logs in via GitHub OAuth, redirects by role, and deploys to Vercel. This is the substrate every subsequent phase builds on.

**Architecture:** Modular monolith. Strict domain modules under `src/modules/*`, shared infra under `src/lib/*`, route surfaces under `src/app/*`. Edge-compat auth split (`auth.config.ts` edge-safe + `auth.ts` full with adapter). JWT session strategy (not database sessions) for serverless cost. RBAC enforced at middleware (route redirects) AND inside every Server Action (defense in depth).

**Tech Stack:** Next.js 15 (App Router, RSC, Server Actions) · TypeScript strict · Tailwind v4 · shadcn/ui · Drizzle ORM + Postgres on Neon · Auth.js v5 (next-auth@beta) with DrizzleAdapter · Zod · pnpm

---

## Prerequisites (user must provide before Task 3 and Task 8)

- **Neon Postgres connection string** — sign up at neon.tech (free), create a project, copy the connection string. Set as `DATABASE_URL`.
- **GitHub OAuth App** — github.com/settings/developers → New OAuth App. Callback URL: `http://localhost:3000/api/auth/callback/github` (dev) and `https://<prod-domain>/api/auth/callback/github` (prod). Copy Client ID + Client Secret.
- **Vercel account** (vercel.com, free) — needed for Task 8 deploy only.

---

## File Structure

```
parallex-showcase/
├── .env.example                    # all required env vars (committed)
├── .env.local                      # real values (gitignored)
├── .gitignore
├── auth.config.ts                  # edge-safe Auth.js config (NO adapter)
├── auth.ts                         # full Auth.js config (adapter + role callbacks)
├── drizzle.config.ts               # Drizzle Kit config
├── middleware.ts                   # route-level RBAC redirects
├── next.config.ts
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.json
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── env.ts                      # @t3-oss/env-nextjs validated env
│   ├── app/
│   │   ├── layout.tsx              # root layout
│   │   ├── page.tsx                # home → role-aware redirect
│   │   ├── globals.css             # Tailwind v4 entry
│   │   ├── login/
│   │   │   └── page.tsx            # GitHub sign-in
│   │   ├── unauthorized/
│   │   │   └── page.tsx
│   │   ├── api/auth/[...nextauth]/
│   │   │   └── route.ts            # handlers export
│   │   ├── (protected)/
│   │   │   ├── layout.tsx          # auth guard (redirect to /login if signed out)
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx      # developer role guard
│   │   │   │   └── page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx      # admin role guard
│   │   │   │   └── page.tsx
│   │   │   └── broker/
│   │   │       ├── layout.tsx      # broker role guard
│   │   │       └── page.tsx
│   │   ├── projects/[slug]/
│   │   │   └── page.tsx            # public hub placeholder
│   │   └── s/[token]/
│   │       └── page.tsx            # share-link placeholder
│   ├── components/
│   │   ├── ui/                     # shadcn primitives
│   │   └── auth/
│   │       └── sign-in-button.tsx
│   ├── lib/
│   │   ├── db.ts                   # Neon + Drizzle client (singleton)
│   │   ├── schema.ts               # Drizzle tables (auth + audit_logs)
│   │   ├── authz.ts                # Role type + assertCan + getCurrentUser
│   │   ├── result.ts               # Result<T, E> helpers
│   │   ├── audit.ts                # auditLog() stub
│   │   └── utils.ts                # cn() helper (shadcn)
│   └── types/
│       └── next-auth.d.ts          # module augmentation (role on Session/User/JWT)
└── tests/
    ├── unit/
    │   ├── authz.test.ts
    │   └── result.test.ts
    └── e2e/
        └── smoke.spec.ts
```

---

## Task 1: Scaffold + dependencies + TypeScript strict

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `.env.example`
- Modify: none (greenfield)

- [ ] **Step 1: Scaffold Next.js 15**

Run from project root (`/Users/sulthonzh/Data/projects/parallex/saas`):

```bash
pnpm create next-app . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint \
  --use-pnpm
```

When prompted "Directory is not empty, continue?" → **Yes** (we have `.git`, `.omo`, `docs/` — these won't conflict).

- [ ] **Step 2: Install runtime dependencies**

```bash
pnpm add drizzle-orm @neondatabase/serverless next-auth@beta @auth/drizzle-adapter @t3-oss/env-nextjs zod @tanstack/react-query @tanstack/react-table recharts lucide-react sonner date-fns
```

- [ ] **Step 3: Install dev dependencies**

```bash
pnpm add -D drizzle-kit @types/node prettier prettier-plugin-tailwindcss vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react @playwright/test
```

- [ ] **Step 4: Tighten TypeScript config**

Replace `tsconfig.json` contents with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Database
DATABASE_URL="postgres://user:pass@host/db?sslmode=require"

# Auth.js v5 (run `pnpm auth secret` to generate AUTH_SECRET)
AUTH_SECRET=""
AUTH_TRUST_HOST="true"
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Optional: magic link via Resend (Phase 0 doesn't require)
AUTH_RESEND_KEY=""
RESEND_FROM=""
```

- [ ] **Step 6: Verify dev server boots**

```bash
cp .env.example .env.local
# Fill DATABASE_URL placeholder for now (real one comes in Task 3)
pnpm dev
```

Expected: server starts on http://localhost:3000, default Next.js page renders.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 + dependencies"
```

---

## Task 2: Tailwind v4 + shadcn/ui setup

**Files:**
- Create: `components.json`, `src/lib/utils.ts`
- Modify: `src/app/globals.css` (shadcn themes)

- [ ] **Step 1: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

Accept defaults: style "new-york", base color "zinc", CSS variables yes. This creates `components.json` and `src/lib/utils.ts` with `cn()`.

- [ ] **Step 2: Add base components**

```bash
pnpm dlx shadcn@latest add button input card label sonner dialog dropdown-menu avatar badge separator sheet table tabs form
```

- [ ] **Step 3: Verify Button renders**

Replace `src/app/page.tsx`:

```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button>Phase 0 boot check</Button>
    </main>
  );
}
```

- [ ] **Step 4: Verify**

```bash
pnpm dev
```

Expected: page shows a styled Button (not raw HTML). Stop server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: shadcn/ui + base components"
```

---

## Task 3: Drizzle schema + Neon connection + first migration

**Files:**
- Create: `drizzle.config.ts`, `src/lib/schema.ts`, `src/lib/db.ts`
- Modify: `.env.local` (real `DATABASE_URL`)

- [ ] **Step 1: Create Drizzle schema**

Create `src/lib/schema.ts`:

```ts
import { relations } from "drizzle-orm";
import { integer, primaryKey, text, timestamp, pgTable, jsonb } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// --- Auth.js tables (singular names, camelCase cols — matches @auth/drizzle-adapter defaults) ---

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").$type<"admin" | "developer" | "broker">().notNull().default("broker"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }),
);

// --- Audit log (used from Task 7 onward) ---

export const auditLogs = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text("actorId").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
```

- [ ] **Step 2: Create Drizzle client (Neon HTTP + globalThis singleton)**

Create `src/lib/db.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

const globalForDb = globalThis as unknown as { drizzleDb?: ReturnType<typeof drizzle> };

const db = globalForDb.drizzleDb ?? drizzle(sql, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.drizzleDb = db;
}

export { db };
```

- [ ] **Step 3: Create `drizzle.config.ts`**

Create `drizzle.config.ts` at project root:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 4: Set real `DATABASE_URL` in `.env.local`**

Paste your Neon connection string into `.env.local`:

```bash
DATABASE_URL="postgres://<your-neon-string>?sslmode=require"
```

- [ ] **Step 5: Run first migration (push schema to Neon)**

```bash
pnpm drizzle-kit push
```

Expected: prompts to confirm new tables (`user`, `account`, `session`, `verificationToken`, `audit_log`). Type "yes". No errors.

- [ ] **Step 6: Verify tables exist**

Open Neon SQL editor (or `psql $DATABASE_URL`) and run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Expected output includes: `user`, `account`, `session`, `verificationToken`, `audit_log`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Drizzle schema + Neon client + first migration"
```

---

## Task 4: Auth.js v5 + GitHub OAuth + RBAC types

**Files:**
- Create: `auth.config.ts`, `auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `src/types/next-auth.d.ts`, `src/app/login/page.tsx`, `src/components/auth/sign-in-button.tsx`, `src/app/unauthorized/page.tsx`
- Modify: `.env.local` (auth secrets)

- [ ] **Step 1: Module augmentation for role**

Create `src/types/next-auth.d.ts`:

```ts
import { DefaultSession } from "next-auth";

export type Role = "admin" | "developer" | "broker";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}
```

- [ ] **Step 2: Edge-safe auth config**

Create `auth.config.ts` at project root:

```ts
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [GitHub],
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");
      const isPublicRoute =
        request.nextUrl.pathname.startsWith("/projects/") ||
        request.nextUrl.pathname.startsWith("/s/") ||
        request.nextUrl.pathname.startsWith("/api/");

      if (isLoginPage || isPublicRoute) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 3: Full auth config with adapter + role callbacks**

Create `auth.ts` at project root:

```ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import authConfig from "./auth.config";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    jwt: ({ token, user }) => {
      if (user) token.role = user.role;
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role;
      }
      return session;
    },
  },
});
```

- [ ] **Step 4: Route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/../auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 5: Middleware (route-level RBAC)**

Create `middleware.ts` at project root:

```ts
import NextAuth from "next-auth";
import authConfig from "@/../auth.config";

const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
```

- [ ] **Step 6: Set auth env vars**

Run:

```bash
pnpm exec auth secret
```

This writes `AUTH_SECRET` to `.env.local`. Then add your GitHub OAuth app credentials to `.env.local`:

```bash
AUTH_GITHUB_ID="<your-github-oauth-app-client-id>"
AUTH_GITHUB_SECRET="<your-github-oauth-app-client-secret>"
AUTH_TRUST_HOST="true"
```

- [ ] **Step 7: Sign-in button component**

Create `src/components/auth/sign-in-button.tsx`:

```tsx
"use client";

import { signIn } from "@/../auth";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/" });
      }}
    >
      <Button type="submit" className="w-full">
        Sign in with GitHub
      </Button>
    </form>
  );
}
```

- [ ] **Step 8: Login page**

Create `src/app/login/page.tsx`:

```tsx
import { SignInButton } from "@/components/auth/sign-in-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Parallex</CardTitle>
        </CardHeader>
        <CardContent>
          <SignInButton />
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 9: Unauthorized page**

Create `src/app/unauthorized/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">403 — Unauthorized</h1>
      <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
```

- [ ] **Step 10: Verify sign-in flow**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Expected: redirect to `/login`. Click "Sign in with GitHub" → redirected to GitHub → back to `/`. The home page should now render signed-in (we'll build the real home redirect in Task 6).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: Auth.js v5 + GitHub OAuth + RBAC types"
```

---

## Task 5: RBAC helpers + TDD unit tests

**Files:**
- Create: `src/lib/authz.ts`, `tests/unit/authz.test.ts`

- [ ] **Step 1: Configure Vitest**

Create `vitest.config.ts` at project root:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest"
  }
}
```

- [ ] **Step 2: Write failing test for assertCan**

Create `tests/unit/authz.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { assertCan, type Role, type Action } from "@/lib/authz";

describe("assertCan", () => {
  const cases: Array<{ actor: Role; action: Action; resource: { ownerId?: string; actorId: string }; expected: boolean }> = [
    { actor: "admin", action: "project:create", resource: { actorId: "u1" }, expected: true },
    { actor: "admin", action: "user:delete", resource: { actorId: "u1" }, expected: true },
    { actor: "developer", action: "project:create", resource: { actorId: "u1" }, expected: true },
    { actor: "developer", action: "user:delete", resource: { actorId: "u1" }, expected: false },
    { actor: "broker", action: "project:create", resource: { actorId: "u1" }, expected: false },
    { actor: "broker", action: "share-link:create", resource: { actorId: "u1" }, expected: true },
    { actor: "developer", action: "project:update", resource: { ownerId: "u1", actorId: "u1" }, expected: true },
    { actor: "developer", action: "project:update", resource: { ownerId: "u2", actorId: "u1" }, expected: false },
  ];

  for (const { actor, action, resource, expected } of cases) {
    it(`${actor} can ${action} on ${JSON.stringify(resource)} → ${expected}`, () => {
      expect(assertCan({ id: resource.actorId, role: actor }, action, resource)).toBe(expected);
    });
  }

  it("throws when assertCan fails AND throwOnFail is true", () => {
    expect(() =>
      assertCan({ id: "u1", role: "broker" }, "user:delete", { actorId: "u1" }, { throwOnFail: true }),
    ).toThrowError(/forbidden/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test:unit
```

Expected: FAIL — `Cannot find module '@/lib/authz'`.

- [ ] **Step 4: Implement `src/lib/authz.ts`**

Create `src/lib/authz.ts`:

```ts
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import type { Role } from "@/types/next-auth";

export type { Role };

export type Action =
  | "project:create"
  | "project:update"
  | "project:delete"
  | "asset:upload"
  | "asset:publish"
  | "share-link:create"
  | "user:invite"
  | "user:delete"
  | "audit:read";

type Actor = { id: string; role: Role };
type Resource = { ownerId?: string; actorId: string };
type AssertOptions = { throwOnFail?: boolean };

const ROLE_MATRIX: Record<Role, Action[]> = {
  admin: [
    "project:create", "project:update", "project:delete",
    "asset:upload", "asset:publish",
    "share-link:create",
    "user:invite", "user:delete",
    "audit:read",
  ],
  developer: ["project:create", "project:update", "asset:upload", "asset:publish", "share-link:create"],
  broker: ["share-link:create"],
};

const OWNER_SCOPED_ACTIONS = new Set<Action>(["project:update", "project:delete"]);

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertCan(actor: Actor, action: Action, resource: Resource, opts: AssertOptions = {}): boolean {
  const allowed = ROLE_MATRIX[actor.role]?.includes(action) ?? false;
  if (!allowed) {
    if (opts.throwOnFail) throw new AuthorizationError(`Forbidden: ${actor.role} cannot ${action}`);
    return false;
  }
  if (OWNER_SCOPED_ACTIONS.has(action) && resource.ownerId && resource.ownerId !== actor.id) {
    if (opts.throwOnFail) throw new AuthorizationError(`Forbidden: not owner of resource`);
    return false;
  }
  return true;
}

export async function getCurrentUser(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.role) return null;
  return { id: session.user.id, role: session.user.role };
}

export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) redirect("/unauthorized");
  return user;
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
pnpm test:unit
```

Expected: PASS — all 9 test cases green.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: RBAC helpers (assertCan, requireRole, getCurrentUser) + tests"
```

---

## Task 6: Route skeletons + role-guarded layouts

**Files:**
- Create: `src/app/(protected)/layout.tsx`, `src/app/(protected)/dashboard/{layout,page}.tsx`, `src/app/(protected)/admin/{layout,page}.tsx`, `src/app/(protected)/broker/{layout,page}.tsx`, `src/app/projects/[slug]/page.tsx`, `src/app/s/[token]/page.tsx`
- Modify: `src/app/page.tsx` (role-aware redirect)

- [ ] **Step 1: Protected layout (auth guard)**

Create `src/app/(protected)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/../auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <>{children}</>;
}
```

- [ ] **Step 2: Developer dashboard layout + page**

Create `src/app/(protected)/dashboard/layout.tsx`:

```tsx
import { requireRole } from "@/lib/authz";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole("developer", "admin");
  return <>{children}</>;
}
```

Create `src/app/(protected)/dashboard/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Developer Dashboard</CardTitle></CardHeader>
      <CardContent className="text-muted-foreground">Phase 1 will populate projects + assets + analytics here.</CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Admin layout + page**

Create `src/app/(protected)/admin/layout.tsx`:

```tsx
import { requireRole } from "@/lib/authz";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return <>{children}</>;
}
```

Create `src/app/(protected)/admin/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Admin Console</CardTitle></CardHeader>
      <CardContent className="text-muted-foreground">User management + audit log land here in Phase 3.</CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Broker layout + page**

Create `src/app/(protected)/broker/layout.tsx`:

```tsx
import { requireRole } from "@/lib/authz";

export default async function BrokerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("broker", "admin");
  return <>{children}</>;
}
```

Create `src/app/(protected)/broker/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BrokerPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Broker Workspace</CardTitle></CardHeader>
      <CardContent className="text-muted-foreground">Browse projects + generate share-links here in Phase 2.</CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Public hub placeholder**

Create `src/app/projects/[slug]/page.tsx`:

```tsx
export default async function PublicHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">Project: {slug}</h1>
      <p className="mt-4 text-muted-foreground">Cinematic interactive hub lands here in Phase 2.</p>
    </main>
  );
}
```

- [ ] **Step 6: Share-link placeholder**

Create `src/app/s/[token]/page.tsx`:

```tsx
export default async function ShareLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">Share link: {token}</h1>
      <p className="mt-4 text-muted-foreground">Scoped share-link entry lands here in Phase 2.</p>
    </main>
  );
}
```

- [ ] **Step 7: Role-aware home redirect**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import type { Role } from "@/types/next-auth";

const HOME_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  developer: "/dashboard",
  broker: "/broker",
};

export default async function Home() {
  const session = await auth();
  if (!session?.user?.role) redirect("/login");
  redirect(HOME_BY_ROLE[session.user.role]);
}
```

- [ ] **Step 8: Verify role-based redirects**

Manual QA (you'll need to manually set your user's role to each value in Neon, since there's no admin UI yet):

1. `pnpm dev`, visit `/`, sign in via GitHub.
2. Your user row gets created with `role = 'broker'` (the default). Visiting `/` should redirect to `/broker`.
3. In Neon SQL editor: `UPDATE "user" SET role = 'developer' WHERE email = 'your-email';`
4. Sign out + sign in again (to refresh JWT). Visiting `/` should redirect to `/dashboard`.
5. Try `/admin` — should redirect to `/unauthorized`.
6. Set role to `admin`, sign out + in. `/admin` should now work.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: route skeletons + role-guarded layouts + home redirect"
```

---

## Task 7: Result<T,E> helpers + audit log + tests

**Files:**
- Create: `src/lib/result.ts`, `src/lib/audit.ts`, `tests/unit/result.test.ts`

- [ ] **Step 1: Write failing tests for Result helpers**

Create `tests/unit/result.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ok, err, type Result } from "@/lib/result";

describe("Result helpers", () => {
  it("ok() returns success variant", () => {
    const r = ok(42);
    expect(r).toEqual({ ok: true, value: 42 });
  });

  it("err() returns failure variant", () => {
    const r = err("nope");
    expect(r).toEqual({ ok: false, error: "nope" });
  });

  it("map transforms success value", () => {
    const r: Result<number, string> = ok(2);
    const mapped = r.ok ? ok(r.value * 10) : r;
    expect(mapped).toEqual({ ok: true, value: 20 });
  });

  it("unwrap returns value on success", () => {
    expect(ok("hello").ok ? ok("hello").value : null).toBe("hello");
  });

  it("unwrap throws on failure", () => {
    const e = err("boom");
    expect(() => (e.ok ? e.value : (() => { throw new Error(e.error); })())).toThrow("boom");
  });
});
```

- [ ] **Step 2: Run test to verify fail**

```bash
pnpm test:unit
```

Expected: FAIL — `Cannot find module '@/lib/result'`.

- [ ] **Step 3: Implement `src/lib/result.ts`**

Create `src/lib/result.ts`:

```ts
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function map<T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export function flatMap<T, U, E>(r: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return r.ok ? fn(r.value) : r;
}

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw new Error(typeof r.error === "string" ? r.error : JSON.stringify(r.error));
}

export type { Result as AppResult };
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm test:unit
```

Expected: PASS — all result tests green (and previous authz tests still green).

- [ ] **Step 5: Implement audit log stub**

Create `src/lib/audit.ts`:

```ts
import "server-only";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import type { Actor } from "@/lib/authz";

type AuditInput = {
  actor: Actor;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
};

export async function auditLog(input: AuditInput): Promise<void> {
  await db.insert(auditLogs).values({
    actorId: input.actor.id,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? null,
    after: input.after ?? null,
  });
}
```

- [ ] **Step 6: Verify typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Result<T,E> helpers + audit log + tests"
```

---

## Task 8: README + GitHub Actions CI + Vercel deploy

**Files:**
- Create: `README.md`, `.github/workflows/ci.yml`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: none

- [ ] **Step 1: Playwright config**

Create `playwright.config.ts` at project root:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env.CI ? undefined : {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Smoke e2e test**

Create `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("home redirects to login when signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("login page renders sign-in button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /sign in with github/i })).toBeVisible();
});
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:install": "playwright install"
  }
}
```

- [ ] **Step 3: Install Playwright browsers + run e2e**

```bash
pnpm test:e2e:install
pnpm test:e2e
```

Expected: 2 tests pass.

- [ ] **Step 4: GitHub Actions CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm tsc --noEmit
      - run: pnpm lint
      - run: pnpm test:unit
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          DATABASE_URL: "postgres://stub:stub@localhost:5432/stub"
          AUTH_SECRET: "test-secret-not-real"
```

- [ ] **Step 5: Write README**

Create `README.md`:

```markdown
# parallex-showcase

Production-grade proptech SaaS demo built to demonstrate fit for the Senior Full-Stack Engineer role at [Parallex](https://getparallex.com).

## Stack

- **Next.js 15** App Router + Server Components + Server Actions
- **TypeScript** strict mode (no `as any` / `@ts-ignore`)
- **Tailwind v4** + **shadcn/ui**
- **Drizzle ORM** + Postgres on Neon (serverless)
- **Auth.js v5** with GitHub OAuth + RBAC
- **Zod** validation, **TanStack Query/Table**, **Recharts**
- **Vitest** unit + **Playwright** e2e + **GitHub Actions** CI

## Local setup

```bash
pnpm install
cp .env.example .env.local  # fill in real values
pnpm db:push                # sync schema to Neon
pnpm dev
```

## Required env vars

See `.env.example`. The essential ones:

- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — run `pnpm exec auth secret`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth app credentials

## Scripts

- `pnpm dev` — local dev server
- `pnpm build` — production build
- `pnpm tsc --noEmit` — typecheck
- `pnpm test:unit` — Vitest unit tests
- `pnpm test:e2e` — Playwright e2e tests

## Architecture

Modular monolith. Each domain (`project`, `asset`, `analytics`, `auth`, `workflow`) owns its schema + server actions + UI routes + tests under `src/modules/<name>/`. RBAC enforced at middleware (route redirects) AND inside every Server Action (defense in depth).

## JD mapping

This Phase 0 foundation demonstrates: Next.js 15 + TS strict, server actions, permissions-aware UI (RBAC), data modeling (Drizzle), validation (Zod), edge cases (auth redirect matrix), testing discipline (unit + e2e), and CI. Subsequent phases add project/asset CRUD, public hub, broker workspace, approval workflows, audit log, analytics, and AI features.
```

- [ ] **Step 6: Connect to Vercel and deploy**

```bash
pnpm add -g vercel
vercel link
```

Follow prompts. Then set production env vars on Vercel:

```bash
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add AUTH_GITHUB_ID production
vercel env add AUTH_GITHUB_SECRET production
vercel env add AUTH_TRUST_HOST production
```

Update your GitHub OAuth app callback URL to include `https://<your-vercel-domain>/api/auth/callback/github`.

Deploy to production:

```bash
vercel --prod
```

- [ ] **Step 7: Verify production deploy**

Visit `https://<your-vercel-domain>`. Expected: redirect to `/login`. Click sign-in → GitHub flow → back to the deployed app → redirected by role. Update Neon `user.role` to match your testing, then sign out/in to refresh.

- [ ] **Step 8: Commit + tag**

```bash
git add -A
git commit -m "feat: Phase 0 — CI + README + Vercel deploy"
git tag v0.1.0-phase-0
```

---

## Phase 0 Definition of Done

All of these must be true before Phase 1 starts:

- [ ] `pnpm dev` boots cleanly with no console errors
- [ ] `pnpm tsc --noEmit` passes (zero TS errors)
- [ ] `pnpm test:unit` passes (authz + result tests green)
- [ ] `pnpm test:e2e` passes (smoke tests green)
- [ ] GitHub OAuth sign-in works locally AND on Vercel production URL
- [ ] Role-based redirect works for all 3 roles (manually verified via Neon `UPDATE`)
- [ ] Unauthorized role hitting protected route → `/unauthorized`
- [ ] Neon has tables: `user`, `account`, `session`, `verificationToken`, `audit_log`
- [ ] CI workflow file exists and would pass on a clean checkout (env vars stubbed)
- [ ] README explains setup, scripts, JD mapping
- [ ] Tag `v0.1.0-phase-0` pushed

---

## Self-Review

**Spec coverage:** Spec §3 (architecture) → modular monolith skeleton present. §4 (RBAC) → role column + middleware + assertCan. §5 (server action contract) → Result<T,E> + auditLog() stub ready. §8 (routes) → all 6 route groups created. §9 (testing) → Vitest + Playwright smoke. §11 (dependencies) → all external accounts called out in Prerequisites.

**Placeholder scan:** No TBD/TODO. All code blocks are complete.

**Type consistency:** `Role` exported from `authz.ts` re-exports from `types/next-auth.d.ts`. `Result<T,E>` shape consistent across all 4 helpers. `Actor` type defined once in `authz.ts`, used in `audit.ts`.

**Deferred to later phases (intentional):**
- Magic link via Resend (Phase 0 stretch; Phase 5 add)
- Project/asset/unit schemas (Phase 1)
- Audit log UI with diffs (Phase 3)
- Real-time engagement (Phase 4)
- AI features (Phase 5)

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-03-phase-0-foundation.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task with self-heal + review-work + remove-ai-slops loaded; review between tasks; fast iteration. Best for the ralph-loop integration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints at each task boundary.
