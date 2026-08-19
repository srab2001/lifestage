# Test Plan

What should be verified before calling a change to this proof-of-concept
done, grouped by the same audiences `USER_GUIDE.md` uses. "How" points at
the actual automated check where one exists (`npm run <script>` — see
`package.json`) or the manual steps to follow where it doesn't.

## Automated checks (run these first, every time)

| Check | Command | Covers |
| --- | --- | --- |
| Lint | `npm run lint` | ESLint rules across `app/`, `components/`, `lib/`. |
| Type check + production build | `npm run build` | TypeScript errors, server/client boundary mistakes, static generation of `/`, `/apply`, `/schema`. |
| Accessibility (WCAG 2.1 A/AA) | `npm run test:a11y` | `tests/a11y.spec.ts` — axe-core scan of every unauthenticated static page: `/`, `/apply`, `/schema`, `/third-party/invalid-token`. Requires a Chromium binary; set `PLAYWRIGHT_CHROMIUM_PATH` if the pinned Playwright revision isn't installed (see `LESSONS_LEARNED.md`). |

These three are cheap and fast — run them before anything manual below,
and re-run all three after any fix, not just the one that failed.

## 1. Claimant / Veteran: the Lifestage interview (`/apply`)

| What to test | How | Priority |
| --- | --- | --- |
| All 7 wizard steps complete in order and persist on Back | Manual: walk the full flow at `/apply` (veteran info → claimant info → dependents → Aid & Attendance → evidence & extraction → physician routing → review & submit). | Smoke |
| Validation errors surface the real failing field | Manual: submit a step with a required field empty (e.g. a dependent with no date of birth); confirm the red banner names the specific field, not a generic message. | Regression — regressed once, see `LESSONS_LEARNED.md`. |
| Evidence upload returns deterministic mock extraction | Manual: upload the same file twice; confirm identical extracted fields/confidence scores both times, and that anything under 85% confidence is flagged **Needs review** and editable. | Regression |
| Physician link generation | Manual: from the routing step, generate a secure link and confirm it's a working `/third-party/<token>` URL. | Smoke |
| Submission produces a confirmation number | Manual: complete review & submit; confirm redirect to `/confirmation/[id]` with a real confirmation number. | Smoke |
| API-level schema validation | Automated indirectly via `/schema` matching `lib/schema.ts` Zod definitions — POST an invalid payload to `/api/submissions` and confirm a 400 with issue paths/messages, not a silent 500 or generic error. | Edge case |

## 2. Physician: routed exam (`/third-party/[token]`)

| What to test | How | Priority |
| --- | --- | --- |
| Valid token shows the claimant/Veteran context and exam form | Manual: open a freshly generated link. | Smoke |
| Link works exactly once | Manual: submit & e-sign, then reload the same URL — must show a confirmation message, not the form again. | Regression |
| Invalid/expired token handling | Automated (a11y coverage only) via `/third-party/invalid-token`; manually confirm the copy reads "Link not found or expired" for both an unknown token and one past its 7-day expiry. | Edge case |
| Submission updates dashboard trace immediately | Manual: submit a physician form, then load `/dashboard` for that claim without any polling/refresh trick — the new trace event must already be there. | Regression |

## 3. Staff: observability dashboard (`/dashboard`)

| What to test | How | Priority |
| --- | --- | --- |
| Google auth gate restricts to `@adhocteam.us` (or `ADMIN_EMAILS` when set) | Manual: attempt sign-in with a non-`adhocteam.us` Google account; confirm rejection (see `auth.ts` `signIn` callback). Requires a real OAuth app — not covered by the automated a11y pass. | Smoke |
| A real Google account can complete sign-in at all | Manual: with `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` set in Vercel, click through Google's consent screen from `/dashboard`'s redirect and confirm it lands back on `/dashboard` signed in — not a Google-side "Error 401: invalid_client". This checks the provider is actually wired to those env var names, not just that credentials exist somewhere. Regressed once, see `LESSONS_LEARNED.md`. | Smoke — regression |
| Six live metrics render and match store state | Manual: cross-check totals/averages shown against the number of records actually created. | Regression |
| Claims list → detail → transaction trace | Manual: click a row, confirm the trace lists intake/extraction/routing/validation/submission events in order with timestamps. | Smoke |
| Dashboard reflects new data without a live push | Manual: create or update a submission in another tab, then reload the dashboard tab — must show the new state (no auto-push is expected). | Edge case |

## 4. Anyone: published schema (`/schema`)

| What to test | How | Priority |
| --- | --- | --- |
| Schema page matches `lib/schema.ts` | Manual: spot-check a field's required/optional status and shape against the rendered JSON Schema after any change to `lib/schema.ts`. | Regression |
| Keyboard access to the scrollable schema block | Covered by `npm run test:a11y` (`tabIndex`/`aria-label` regression, see `LESSONS_LEARNED.md`). | Regression |

## 5. Deployment / environment

| What to test | How | Priority |
| --- | --- | --- |
| Fresh Neon branch needs no manual migration | Manual: point `DATABASE_URL` at a brand-new Postgres branch and hit any DB-backed route — `PostgresStore` must create its own tables on first query. | Edge case |
| Production requires a real `AUTH_SECRET` | Manual: run `npm run build && npm run start` (or deploy to Vercel) without `AUTH_SECRET` set — every auth-touching route should fail loudly, not silently. `npm run dev` should work without it via the non-production fallback. | Regression |
| Preview URLs vs. production URL auth behavior | Manual: load a PR preview URL unauthenticated (expect a Vercel SSO redirect) and the production `.vercel.app` URL unauthenticated (expect the page directly, no Vercel login). | Regression |
| No unauthenticated route leaks claimant data | Manual: audit every route under `app/api/` for an actual caller in the app and for auth/authz on anything returning claimant records. | Smoke — regressed once (`GET /api/submissions`), see `LESSONS_LEARNED.md`. |

## Adding to this plan

When code changes add a new route, component, or edge case, add a row to
the relevant section above in the same pass — don't let this file describe
only what existed at project kickoff.
