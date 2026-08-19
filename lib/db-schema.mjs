// Shared DDL for the Postgres-backed store. Plain JS (not .ts) so it can be
// imported directly by scripts/init-db.mjs (a plain Node script) as well as
// by lib/store.ts. Keep this the single source of truth for table shapes.
export const INIT_STATEMENTS = [
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
