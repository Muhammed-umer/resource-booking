import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const MISSING_URL_MESSAGE =
  "DATABASE_URL is not set. Copy .env.example to .env.local and paste the Supabase connection string (Session pooler, port 5432).";

/**
 * Supabase pools connections, so keep the client small and reuse it across hot
 * reloads. `prepare: false` is required when talking through the pooler.
 *
 * The client is created on first query rather than at import time, so
 * `next build` does not need a live database URL.
 */
const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  db?: PostgresJsDatabase<typeof schema>;
};

function connect(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.db) return globalForDb.db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(MISSING_URL_MESSAGE);
  }

  const sql = postgres(connectionString, { max: 5, prepare: false });
  const instance = drizzle(sql, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.sql = sql;
    globalForDb.db = instance;
  }

  return instance;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, property, receiver) {
    return Reflect.get(connect(), property, receiver);
  },
});

export { schema };
