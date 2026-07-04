import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(
  process.env.DATABASE_URL ?? "postgres://stub:stub@localhost/stub",
);

const globalForDb = globalThis as unknown as {
  drizzleDb?: ReturnType<typeof drizzle>;
};

const db = globalForDb.drizzleDb ?? drizzle(sql, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.drizzleDb = db;
}

export { db };
