import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// --- Auth.js tables (singular SQL names, camelCase cols — matches @auth/drizzle-adapter) ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role")
    .$type<"admin" | "developer" | "broker">()
    .notNull()
    .default("broker"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
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
  projects: many(projects),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// --- Phase 1: Projects, Assets, Units ---

export const projectStatus = pgEnum("project_status", ["draft", "published"]);

export const projects = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  developerId: text("developerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  status: projectStatus("status").notNull().default("draft"),
  heroImageUrl: text("heroImageUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const assetType = pgEnum("asset_type", [
  "render",
  "film",
  "floorplan",
  "brochure",
  "gallery",
]);
export const assetStatus = pgEnum("asset_status", [
  "draft",
  "pending",
  "approved",
  "published",
]);

export const assets = pgTable("asset", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: assetType("type").notNull().default("gallery"),
  status: assetStatus("status").notNull().default("draft"),
  title: text("title").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  description: text("description"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const unitStatus = pgEnum("unit_status", [
  "available",
  "reserved",
  "sold",
]);

export const units = pgTable("unit", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name"),
  beds: integer("beds"),
  baths: integer("baths"),
  areaSqft: integer("areaSqft"),
  price: integer("price"),
  floorNumber: integer("floorNumber"),
  status: unitStatus("status").notNull().default("available"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  developer: one(users, {
    fields: [projects.developerId],
    references: [users.id],
  }),
  assets: many(assets),
  units: many(units),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  project: one(projects, {
    fields: [assets.projectId],
    references: [projects.id],
  }),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  project: one(projects, {
    fields: [units.projectId],
    references: [projects.id],
  }),
}));
