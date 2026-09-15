import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local on its own; drizzle-kit runs outside Next, so load
// it here too. Ignored when the file is absent (e.g. CI with real env vars).
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — fall back to whatever is already in the environment
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
