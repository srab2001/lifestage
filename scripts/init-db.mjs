// Manually (re-)creates the tables the Postgres-backed store expects.
// Run with `npm run db:init` once DATABASE_URL is set (see README). Not
// required for correctness — lib/store.ts creates the same tables lazily
// on first query — but useful for CI/ops visibility and to pre-warm a
// fresh Neon branch before traffic hits it.
import pg from "pg";
import { INIT_STATEMENTS } from "../lib/db-schema.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set — nothing to initialize.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

for (const statement of INIT_STATEMENTS) {
  await pool.query(statement);
}

console.log("Lifestage schema initialized.");
await pool.end();
