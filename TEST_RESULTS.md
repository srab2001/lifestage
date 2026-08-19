# Test Results

Last known outcome for each item in `TEST_PLAN.md`. This tracks current
status, not a historical log — update a row in place when it's re-run
rather than adding a new one for the same test.

## Automated checks

| Check | Result | Date | Notes |
| --- | --- | --- | --- |
| `npm run lint` | ✅ Pass | 2026-08-19 | No errors or warnings. |
| `npm run build` | ✅ Pass | 2026-08-19 | Compiles, type-checks, and statically generates `/`, `/apply`, `/schema` (`_not-found`) with no errors. |
| `npm run test:a11y` | ✅ Pass (4/4) | 2026-08-19 | All four pages (`/`, `/apply`, `/schema`, `/third-party/invalid-token`) clean against WCAG 2.1 A/AA via axe-core. Ran with `PLAYWRIGHT_CHROMIUM_PATH` pointed at the environment's installed Chromium. Build/start logs show `MissingSecret` auth errors during the run — expected, since `AUTH_SECRET` isn't set in this environment and none of the scanned pages touch auth. |

## 1. Claimant / Veteran interview

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| All 7 steps complete and persist on Back | Not run here | — | Needs a live `npm run dev` session and manual walkthrough; not exercised by the automated suite. |
| Validation errors show the real failing field | Not run here | — | Regression check for the fix in `LESSONS_LEARNED.md` — needs manual verification. |
| Deterministic mock extraction + confidence flagging | Not run here | — | Manual check. |
| Physician link generation | Not run here | — | Manual check. |
| Submission → confirmation number | Not run here | — | Manual check. |
| API schema validation (400 on bad payload) | Not run here | — | Manual/`curl` check against `/api/submissions`. |

## 2. Physician routed exam

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| Valid token shows form | Not run here | — | Manual check. |
| Link works exactly once | Not run here | — | Manual check. |
| Invalid/expired token page | ✅ Pass (a11y only) | 2026-08-19 | `/third-party/invalid-token` covered by `test:a11y`; copy/behavior itself not manually re-verified this pass. |
| Dashboard trace updates immediately after submission | Not run here | — | Manual check. |

## 3. Staff dashboard

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| Google auth gate (`@adhocteam.us` only, or `ADMIN_EMAILS`) | Not run here | — | Requires a real OAuth app/credentials; not available in this environment. |
| A real Google account can complete sign-in | ❌ Failed in production, fixed | 2026-08-19 | Found live: Google returned "Error 401: invalid_client" before reaching this app. Root cause was code, not Google Console config — `auth.ts` relied on Auth.js v5's automatic `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` inference while the docs instructed `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, so the provider never read the configured credentials. Fixed by wiring `clientId`/`clientSecret` explicitly; see `LESSONS_LEARNED.md`. End-to-end sign-in with a real account still needs a human to confirm post-fix — not verifiable from this environment. |
| Six live metrics accuracy | Not run here | — | Manual check against store data. |
| Claims list → detail → trace | Not run here | — | Manual check. |
| Dashboard reflects new data on reload | Not run here | — | Manual check. |

## 4. Published schema

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| `/schema` matches `lib/schema.ts` | ✅ Pass (build-time) | 2026-08-19 | Page statically generated successfully in `npm run build`; it's derived directly from the Zod schema so it can't drift independently. |
| Keyboard access to schema block | ✅ Pass | 2026-08-19 | Covered by `test:a11y`. |

## 5. Deployment / environment

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| Fresh Neon branch self-migrates | Not run here | — | Requires a real Postgres branch; this environment has no `DATABASE_URL` configured. |
| Production requires real `AUTH_SECRET` | ✅ Pass (partially observed) | 2026-08-19 | `npm run test:a11y`'s production build/start confirmed auth routes error loudly (`MissingSecret`) without the env var set, consistent with the documented behavior; the dev-mode fallback path wasn't separately re-verified this pass. |
| Preview vs. production URL auth behavior | Not run here | — | Requires an actual Vercel deployment; not exercised from this environment. |
| No unauthenticated route leaks claimant data | Not run here | — | Needs a manual route-by-route audit; last confirmed fixed per `LESSONS_LEARNED.md` (`GET /api/submissions`). |
