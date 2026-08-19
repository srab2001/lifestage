// Creates the tables the Postgres-backed store in lib/store.ts expects.
// Run with `npm run db:init` once DATABASE_URL is set (see README).
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set — nothing to initialize.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

const statements = [
  `create table if not exists submissions (
    id text primary key,
    data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists third_party_requests (
    id text primary key,
    token text unique not null,
    submission_id text not null references submissions(id),
    data jsonb not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists trace_events (
    id text primary key,
    submission_id text not null,
    step text not null,
    message text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists trace_events_submission_id_idx on trace_events (submission_id)`,
];

for (const statement of statements) {
  await pool.query(statement);
}

console.log("Lifestage schema initialized.");
await pool.end();
