# Lessons Learned

Working notes from building and shipping this proof-of-concept, kept for
whoever picks up Phase 9+ (or a similar build). Organized by theme, not
chronology.

## Next.js 16 is not the Next.js in most training data

`create-next-app` on this project pulled Next.js 16.3.1, which has several
breaking changes from the Next 13/14 patterns most documentation and model
training data assumes:

- **`middleware.ts` is renamed `proxy.ts`**, and the exported function
  should be named `proxy` (default or named export). The old name still
  half-works during a deprecation window, which makes the breakage easy to
  miss until routing behaves strangely.
- **`params` and `searchParams` are `Promise`s** in both page components
  and route handlers (`{ params }: { params: Promise<{ id: string }> }`,
  `await params`). This started in Next 15 but is easy to get wrong from
  memory.
- **Turbopack is the default bundler** for both `dev` and `build` — no
  flag needed, and no fallback to webpack without explicit configuration.
- The project ships its own agent guidance at
  `node_modules/next/dist/docs/` specifically because of this — worth
  reading before writing Next.js code against an unfamiliar major version,
  not just this one.

## Auth.js v5 (NextAuth): one config mistake causes a silent infinite loop

Setting `pages: { signIn: "/api/auth/signin" }` in the NextAuth config —
i.e., pointing the custom sign-in page at NextAuth's *own default* sign-in
route — creates an infinite redirect loop: unauthenticated access
redirects to the configured sign-in page, which (being the same route)
redirects again. `curl -L` hit its max-redirects ceiling before this was
diagnosed. **The fix is not to set `pages.signIn` at all** unless you're
pointing it at a real custom page you built yourself; the default page
works fine without any `pages` config.

Two related environment-sensitivity issues surfaced only when testing
under different run modes:

- **`AUTH_SECRET` is required, with no built-in dev fallback.** Without
  it, every auth-touching route 500s with `MissingSecret`. We added an
  explicit fallback secret gated to non-production `NODE_ENV` so
  `npm run dev` works out of the box, while production (Vercel) still hard
  -requires a real secret — the security property you actually want.
- **`trustHost` matters outside Vercel.** Vercel deployments are trusted
  automatically, but running `npm run start` locally (or on any non-Vercel
  host) throws `UntrustedHost` the moment anything touches a session —
  including Next's automatic `<Link>` prefetching of the dashboard nav
  item from *every other page*, so the error shows up on pages that have
  nothing to do with auth. Fixed with an explicit `trustHost: true`.

## Schema-first validation works — including finding the UI's own bugs

The very first end-to-end test run hit a real validation failure: the
dependents step allowed continuing with an empty date of birth, and the
API correctly rejected it with a 400. But the wizard's error handling
swallowed the actual message behind a generic "something went wrong,"
which is exactly the kind of silent failure the design doc's "nothing
fails silently" principle is supposed to prevent — the principle applies
to the UI's own error handling, not just the backend. Fixed by surfacing
the real Zod issue paths/messages in the error banner. Worth remembering:
a good validation layer is only as good as what the UI does when it
rejects something.

## Local success does not mean production success

Local dev (in-memory store) and a clean `npm run build` gave no signal
about a class of bugs that only exist in the real Postgres path:

- **The database connection can succeed while the schema is missing.**
  Neon's `DATABASE_URL` was live and reachable, but `npm run db:init` is a
  manual step (Phase 3 in the design doc) that's trivial to forget once
  env vars are wired up — every DB-backed route 500'd with
  `relation "submissions" does not exist` until it was run. We changed
  `PostgresStore` to idempotently create its own tables on first query
  (shared DDL between `lib/store.ts` and `scripts/init-db.mjs`), so a
  fresh Neon branch just works without a manual migration step — the
  "nothing fails silently" principle applied to our own deploy process,
  not just the claimant-facing flow.
- **Vercel's runtime-error and log tools were the actual debugging path**,
  not guesswork or re-reading code. `get_runtime_errors` (grouped error
  clusters with counts and affected routes) found the missing-table error
  in seconds; without API/MCP access to a deployed environment's logs,
  this would have taken much longer to isolate from the outside.

## Unused code is an attack surface, not just dead weight

`GET /api/submissions` — added early, never called by any page in the
app (the dashboard reads the store directly, server-side) — returned
every claimant's full record, SSNs included, to anyone who requested it,
unauthenticated. It was found while verifying production, not during
development, because nothing in the demo flow ever exercised it. Lesson:
audit every route for an actual caller before shipping, especially ones
added "for completeness" or debugging and then forgotten.

## Accessibility tooling catches things manual review won't

Adding `@axe-core/playwright` as a CI gate (Phase 8) found a real WCAG
2.1.1/2.1.3 violation on the very first run: the `/schema` page's
scrollable `<pre>` block had no keyboard focus target, so a keyboard-only
user couldn't scroll it at all. It rendered correctly and looked
completely normal — this is not a class of bug visual review reliably
catches. Fixed with `tabIndex={0}` and an `aria-label`.

Separately: `@playwright/test`'s pinned browser revision didn't match the
Chromium build already present in this environment
(`/opt/pw-browsers`), causing `browserType.launch` to fail looking for a
revision-specific binary. Fixed by making the test config accept an
explicit `executablePath` override via an env var, used locally, while CI
does a normal `npx playwright install --with-deps chromium`. If Playwright
version-pins ever drift again, check the browser revision path before
assuming the whole test is broken.

## Vercel deployment protection isn't uniform across URLs

The project's "Vercel Authentication" (SSO) setting is
`all_except_custom_domains`, and in practice this meant **preview
deployment URLs require Vercel team login, but the production `.vercel.app`
alias does not** — confirmed empirically (previews 302 to
`vercel.com/sso-api`; production returns the page directly). This wasn't
obvious from the settings API response alone and is worth checking with a
real unauthenticated request (not just a tool that has standing access)
before telling anyone a link is externally shareable.

## Process: don't stack new work on an already-merged PR's branch

Once a PR merges, its source branch is finished — pushing new commits
directly onto it and opening a second PR from the same branch tangles the
history (the new PR's base includes the old, already-merged commit,
alongside a separate merge commit for it on `main`). The correct move,
confirmed by trial: reset the branch to the latest `main`
(`git checkout -B <branch> origin/main`), cherry-pick or re-apply the new
work on top, then `push --force-with-lease` — safe specifically because
the only history being discarded is already merged into `main` under a
different commit.
