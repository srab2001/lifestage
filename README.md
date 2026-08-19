# Lifestage Benefits Optimization — Proof-of-Concept

A working proof-of-concept built by Ad Hoc for VA-26-00077490 (Lifestage
Benefits Optimization). It demonstrates one continuous claimant journey
across three PWS problem areas — the Lifestage forms experience, document
services extraction and validation, and secure third-party routing — backed
by a single validated data record and a live observability dashboard.

The full design rationale, PWS capability mapping, process/data-flow
diagrams, and the phased Claude Code build guide this app follows live in
[`docs/Lifestage_Benefits_Optimization_Design_Strategy.docx`](docs/Lifestage_Benefits_Optimization_Design_Strategy.docx).
The `docs/wf-*.png` files are the original structure-only wireframes this UI
implements.

**This is a capture/design proof-of-concept, not a VA.gov production
system.** See "What this proof-of-concept intentionally does not attempt"
in the design doc (Section 7) — no real OCR/ML, no Login.gov/ID.me, no
VA.gov Design System, no integration with BGS/MMS/MAS/BPDS, no real Kafka.

## What's here

| Area | Where |
| --- | --- |
| Data dictionary (Zod schemas, single source of truth) | `lib/schema.ts`, viewable at `/schema` |
| Store (Postgres via Neon, in-memory fallback) | `lib/store.ts` |
| Mock CAVE-style extraction | `lib/extract.ts` |
| Landing page | `app/(main)/page.tsx` |
| Lifestage interview wizard | `app/(main)/apply`, `components/wizard/*` |
| Public physician portal (single-use link) | `app/third-party/[token]` |
| Confirmation | `app/(main)/confirmation/[id]` |
| Staff observability dashboard (Google-auth gated) | `app/(main)/dashboard` |
| Google auth (Auth.js v5) | `auth.ts`, `proxy.ts` |
| API routes | `app/api/*` |

## Running locally

```bash
npm install
npm run dev
```

Without `DATABASE_URL` set, the app runs on an in-memory store — data
resets on restart, which is fine for exploring the interview flow. Without
`AUTH_SECRET`/`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` set, `/dashboard`
will redirect to a sign-in page that has no working provider configured;
see Phase 0 below to wire up real Google OAuth.

Copy `.env.example` to `.env.local` and fill in values as you complete the
setup steps below.

## Environment & account setup (Phase 0 — manual)

These four steps are console-driven and can't be automated by an agent —
OAuth consent screens and account creation require a human in the browser.

1. **GitHub** — this repository is the source of truth for code and docs.
2. **Vercel** — create a project and link it to this GitHub repo (Import
   Git Repository in the Vercel dashboard, or `vercel link`) so every push
   gets a preview deployment and merges to `main` promote to production.
3. **Neon** — create a Neon project and a `main` database branch in a
   region close to the Vercel deployment; copy the pooled connection
   string into `DATABASE_URL`. Neon's official Vercel integration can
   additionally provision a fresh database branch per preview deployment.
4. **Google Cloud** — in Google Cloud Console under APIs & Services →
   Credentials, create an OAuth 2.0 Client ID (Web application) and add
   authorized redirect URIs for local, preview, and production
   (`http://localhost:3000/api/auth/callback/google` plus the Vercel
   equivalents). Note the Client ID and Client Secret.

   Google OAuth here is a pragmatic way to restrict who can reach the
   shared staff dashboard during development and review — a small, known
   set of Ad Hoc and VA reviewer accounts (see `auth.ts`, restricted to
   `@adhocteam.us`). It is **not** a proposal to use Google as the
   Veteran-facing identity provider — production VA.gov authentication
   runs through Login.gov/ID.me and VA's ICN-based identity model
   (PWS 8.1.9).

## Database setup

Once `DATABASE_URL` is set (locally and in Vercel for `production` and
`preview`):

```bash
npm run db:init
```

This creates the `submissions`, `third_party_requests`, and `trace_events`
tables the Postgres-backed store in `lib/store.ts` expects.

## Architecture

- **Next.js 16 (React, TypeScript, App Router)** — server-rendered pages
  for the Veteran interview, physician portal, and staff dashboard, with
  API routes handling extraction, routing, and submission logic.
- **Zod** — the single data-dictionary/schema referenced throughout PWS
  2.3.2, validating every submission at intake, after extraction, and
  after third-party completion. A generated JSON Schema is published at
  `/schema`.
- **Postgres (Neon)** — structured, durable storage for every submission,
  dependent, evidence record, and third-party request.
- **Event-sourced transaction trace** — a lightweight trace-event log
  recorded at each step (intake, extraction, routing, validation,
  submission), standing in for the Kafka-based tracing PWS 2.3.2 calls
  for, and powering the observability dashboard.
- **Vercel** — preview deployments per pull request, production on merge
  to `main`.
- **Auth.js (NextAuth v5)** — Google OAuth restricted to `@adhocteam.us`,
  gating `/dashboard` only.

## CI

`.github/workflows/ci.yml` runs two jobs on every pull request and push to
`main`:

- `lint-and-build` — `npm run lint` and `npm run build`.
- `accessibility` — `npm run test:a11y`, an automated WCAG 2.0/2.1 A/AA
  sweep (Playwright + axe-core, see `tests/a11y.spec.ts`) across the pages
  every visitor can reach unauthenticated (`/`, `/apply`, `/schema`, and the
  third-party portal's invalid-link state). Auth-gated and token-gated pages
  aren't covered by this static check — see `LESSONS_LEARNED.md`.

Locally: `npm run test:a11y` (needs Playwright's Chromium —
`npx playwright install chromium` once, or point `PLAYWRIGHT_CHROMIUM_PATH`
at a Chromium binary you already have).

## Phased delivery

This app was built in the same small, independently-shippable phases
described in Section 8 of the design doc: scaffold & CI → Google auth →
Neon data layer → Lifestage interview → extraction & validation → secure
third-party routing → observability & delivery reporting → hardening &
handoff. See the doc for the exact Claude Code prompts used at each phase,
and `LESSONS_LEARNED.md` for what happened when each phase actually ran
against production.

## More documentation

- **[USER_GUIDE.md](USER_GUIDE.md)** — how to use each surface of the app:
  the claimant interview, the physician portal, and the staff dashboard.
- **[LESSONS_LEARNED.md](LESSONS_LEARNED.md)** — what broke, what surprised
  us, and what we'd do differently, from scaffold through production
  verification.
- **[docs/Lifestage_Benefits_Optimization_Design_Strategy.docx](docs/Lifestage_Benefits_Optimization_Design_Strategy.docx)**
  — the original design rationale and PWS capability mapping, kept current
  with build/verification status.

## Handoff & credential rotation

Before handing this off or extending it beyond the current reviewer set,
rotate every credential that was typed into a laptop or a chat during
Phase 0/2/3 setup:

1. **Google OAuth** — in Google Cloud Console, generate a new Client
   Secret for the existing Client ID (or a new Client ID entirely), update
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in Vercel, then delete the old
   secret.
2. **AUTH_SECRET** — generate a fresh one (`openssl rand -base64 32`) and
   update it in Vercel. This invalidates all existing sessions, which is
   the point.
3. **Neon `DATABASE_URL`** — reset the database password/role from the
   Neon console (or provision a new role) and update `DATABASE_URL` in
   Vercel for both Production and Preview.

After rotating, redeploy (any push, or a manual redeploy from the Vercel
dashboard) so the running app picks up the new values — Vercel env var
changes don't take effect on already-running deployments.
