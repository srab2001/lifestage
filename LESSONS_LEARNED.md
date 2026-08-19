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
- **The bare `Google` provider silently reads the wrong env var names.**
  `providers: [Google]` (no explicit config) relies on Auth.js v5's
  automatic environment inference, which expects `AUTH_GOOGLE_ID` /
  `AUTH_GOOGLE_SECRET`. This repo's own `.env.example` and README
  instruct setting `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` instead —
  a legacy-feeling but common naming choice that Auth.js v5 doesn't
  auto-detect. The mismatch produces no error anywhere in this app: it
  sends Google an empty `client_id`, and the failure — "Error 401:
  invalid_client / The OAuth client was not found" — happens entirely on
  Google's own consent screen before the request ever reaches this
  app's code or logs. A real user hit this in production; it looked
  exactly like a Google Cloud Console misconfiguration (wrong/deleted
  OAuth client) right up until checking `auth.ts` against Auth.js v5's
  actual env-var convention. **Fixed by wiring `clientId`/`clientSecret`
  explicitly** (`Google({ clientId: process.env.GOOGLE_CLIENT_ID, ... })`)
  rather than renaming the already-documented, already-configured Vercel
  env vars. Lesson: when a provider "just reads env vars," verify which
  names it actually reads before writing docs that tell people to set
  different ones — and remember that OAuth failures on the provider's
  own consent screen are invisible to your own application's logging,
  so "no errors in Vercel" doesn't mean auth is working.

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

## Promise.all is not "run these in order" — a real production incident

The lazy schema-init fix above (idempotent `CREATE TABLE IF NOT EXISTS` on
first query) shipped with its own bug: the four DDL statements ran via
`Promise.all(INIT_STATEMENTS.map(s => pool.query(s)))`. That fires all
four concurrently, and the `pg` `Pool` hands out a separate connection per
`.query()` call — so there's no ordering guarantee between statements
dispatched to different connections. Two of the four statements have real
dependencies (`third_party_requests` references `submissions(id)`; the
`trace_events` index needs `trace_events` to already exist), and in
production this raced: a real user hit
`error: relation "trace_events" does not exist` while submitting the
interview, minutes after the fix that was supposed to prevent exactly
that class of error. Fixed by folding the statements into a sequential
promise chain instead. Lesson: `Promise.all` over independent connections
is a "run these, I don't care about order" primitive — reach for it only
when the operations are genuinely order-independent, which schema DDL
with foreign keys and dependent indexes is not. A live user exercising
the exact code path within minutes of deploy is also a good reminder that
"passed lint and build" is not the same claim as "correct under
concurrency."

## Integrating a real design system: USWDS

Moving from an approximated "VA.gov-inspired" palette to the actual
[USWDS](https://designsystem.digital.gov/) component library
(`@uswds/uswds`) surfaced a few integration specifics:

- **The npm package's `exports` map is stricter than the folder
  structure suggests.** `@uswds/uswds/dist/css/uswds.css` looks like a
  valid path (the file is right there) but fails to resolve under
  Node's `exports` conditions; the package only exposes it via
  `@uswds/uswds/css/uswds.css` (mapped through a `"./css/*"` export).
  Same idea for JS. Check the `exports` field, not the directory
  listing, before assuming an import path.
- **Turbopack resolves and bundles CSS `url()` references against
  `node_modules` automatically** — every font and background-image
  reference inside USWDS's compiled CSS just worked once the CSS import
  itself resolved, with zero manual asset copying. Assets referenced
  directly from *our own JSX* (`<img src="...">`, the banner's flag/lock
  icons) still needed manually copying into `public/`, since those never
  go through the CSS pipeline that does the automatic resolution.
- **A brand color override can lose to a component's own CSS on
  specificity, not source order.** After importing USWDS after Tailwind
  (so our overrides should win on equal specificity), the header nav
  links still rendered in USWDS's default gray instead of white —
  axe-core's accessibility check caught the resulting contrast failure
  immediately (2.01:1 against a 4.5:1 requirement). The actual USWDS
  selector, `.usa-nav__primary > .usa-nav__primary-item > a`, is one
  compound selector more specific than the two-class override we'd
  written, so it won despite loading later in the cascade. Fixed by
  matching that selector's shape (plus `!important` as a deliberate,
  documented exception, since several pseudo-state variants all needed
  covering consistently). Lesson: when a color override doesn't take on
  a real component library, check specificity before assuming import
  order will save you — and let an automated contrast checker catch it
  either way, because this is exactly the kind of regression that looks
  fine to the eye at a glance (navy-on-navy at low opacity vs. the actual
  gray was subtle in a screenshot) and fails hard for anyone with low
  vision.
- **The mobile off-canvas nav panel is real, unmodified USWDS
  behavior** — no backdrop/scrim dimming the rest of the page while
  open, position\:fixed at 15rem wide. It looked like a layout bug on
  first screenshot; it isn't one we introduced.

## Guided tour state must live above the components that unmount

Porting a "Take the tour" walkthrough (adapted from `raven_demo`) into the
7-step Lifestage wizard hit a state-lifetime bug before it ever shipped:
each wizard step is rendered as `{stepIndex === N && <StepComponent/>}`, so
switching steps genuinely unmounts the previous step's component tree and
mounts a new one — it's not just visually hidden. Putting the tour's
active/index state inside a per-step component, or even inside
`WizardShell` (rendered fresh per step), meant the tour reset or
disappeared every time it tried to jump the user to a different step to
highlight something there. Fixed by lifting all tour state into
`ApplyWizard` (the parent that persists across every step switch) and
rendering the `<TourLauncher>` button as a sibling *outside* the
per-step conditional blocks; each tour step's `beforeShow` calls a
`jumpToStep` helper on the parent to actually navigate before highlighting.
`WizardShell` itself only gained a presentational `tourId` prop for the
`data-tour` attribute — it holds no tour state of its own. Lesson: before
attaching any state to a component whose sibling gets swapped in and out,
check whether that component itself survives the swap; if it doesn't,
the state has to live in the ancestor that does.

## `react-hooks/set-state-in-effect`: two different correct fixes, not one

Building the tour component and the `/under-the-hood` live-status page hit
this newer ESLint rule twice, and the two occurrences needed genuinely
different fixes — reaching for the same pattern both times would have been
wrong at least once:

- **Resetting state when a prop changes** (`GuidedTour` resetting its step
  index to 0 whenever `active` flips true) is not an effect's job at all.
  `useEffect(() => { if (active) setIndex(0); }, [active])` is exactly the
  pattern React's own docs warn about (it renders once with stale state,
  then re-renders after the effect fires). Fixed with the documented
  "adjust state during render" pattern instead — track the previous value
  of the prop being watched and compare during render:
  ```tsx
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setIndex(0);
  }
  ```
- **Fetching on mount** (`/under-the-hood`'s initial `/api/status` call)
  *is* legitimately an effect's job, but calling a named async helper
  function from inside the effect (`useEffect(() => { loadStatus(); }, [])`)
  still tripped the rule — the linter's reachability analysis can't see
  through the indirection to confirm the helper doesn't synchronously call
  `setState` before its first `await`. Fixed by inlining the
  `fetch().then()/.catch()` promise chain directly in the effect body
  instead of calling out to a named function, matching a pattern already
  in use elsewhere in this codebase (`physician-portal.tsx`'s token fetch).
  The named helper was kept as a separate function for the "Re-check now"
  button's `onClick`, which isn't inside an effect and isn't subject to the
  rule at all.

Lesson: this rule flags two unrelated situations (state derived from props,
and same-tick `setState` calls the linter can't trace) that happen to
produce the same warning text — diagnose which one you actually have
before picking a fix, rather than applying whichever pattern fixed it last
time.

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
