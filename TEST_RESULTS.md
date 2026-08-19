# Test Results

Last known outcome for each item in `TEST_PLAN.md`. This tracks current
status, not a historical log — update a row in place when it's re-run
rather than adding a new one for the same test.

## Automated checks

| Check | Result | Date | Notes |
| --- | --- | --- | --- |
| `npm run lint` | ✅ Pass | 2026-08-19 | 0 errors, 3 pre-existing `no-img-element` warnings in `gov-banner.tsx` (unrelated to this change). |
| `npm run build` | ✅ Pass | 2026-08-19 | Compiles, type-checks, and statically generates `/`, `/apply`, `/schema`, `/under-the-hood` (`_not-found`) with no errors; `/under-the-hood`'s two new API routes (`/api/status`, `/api/demo/extract-preview`) build as dynamic routes alongside the existing ones. |
| `npm run test:a11y` | ✅ Pass (5/5) | 2026-08-19 | All five pages (`/`, `/apply`, `/schema`, `/third-party/invalid-token`, `/under-the-hood`) clean against WCAG 2.1 A/AA via axe-core, including the new tour buttons and the `/under-the-hood` page's live-status tiles, extraction-preview form, and error-demo buttons. Ran with `PLAYWRIGHT_CHROMIUM_PATH` pointed at the environment's installed Chromium. Re-run after adding the "Why this matters" value callouts (17 `usa-summary-box` instances across every demonstration screen) — still 5/5 clean. |

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

## 5. Guided tours

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| Landing page tour (hero → disclaimer → capabilities → CTA → nav link) | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Screenshot-verified: tour card opens, "STEP 1 OF 5," highlights the hero correctly; stepped through to step 2 cleanly. |
| Wizard tour jump to evidence-upload (step 5 of 7) | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Screenshot-verified: wizard actually navigated to step 5, upload buttons highlighted, tour card correctly reads "STEP 3 OF 5 Evidence upload & extraction." Confirms tour state living in the parent `ApplyWizard` (not per-step components) works across the unmount/remount boundary. |
| Wizard tour jump past evidence/routing without an existing draft | Not separately verified | — | `jumpToStep`'s fire-and-forget `persist({})` wasn't isolated in a dedicated test this pass; covered incidentally by the full step-through smoke run completing without error. |
| Physician portal and dashboard tours | Not run here | — | Dashboard tour needs a signed-in Google session (not available in this environment); physician portal tour needs a freshly generated `/third-party/<token>` link — both are manual checks for a human with real credentials. |
| Schema page tour | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Tour card opens and highlights the hero/data-dictionary block as expected. |
| Tour respects `prefers-reduced-motion` | Not run here | — | Requires manually toggling OS/browser reduced-motion setting; not exercised by the automated or smoke-test pass. |
| `/under-the-hood` has no tour button | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Confirmed no **Take the tour** button renders on the page. |

## 6. `/under-the-hood` live demonstration page

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| `GET /api/status` reports real env/DB/deployment state | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | In this environment (no `DATABASE_URL`/auth env vars set), all tiles correctly showed "not set"/unreachable in red — confirms it reads real `process.env` state, not hardcoded values. |
| Extraction preview calls the real mock-extraction function | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Selected "Marriage certificate," clicked **Run extraction**, got real mock JSON (`spouseFirstName: "Maria"`, `confidence: 0.97`, `status: "accepted"`) matching the same function the real wizard uses. |
| `POST /api/demo/extract-preview` is safe and side-effect-free | Not separately verified | — | No submission/trace record creation was checked directly against the store; the route's implementation takes no submission id and only calls the pure `mockExtractFields` function, so this is verified by code inspection rather than a runtime check this pass. |
| "Call the submissions API with no session" button shows the real 401 | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Screenshot-verified real `{"error":"Unauthorized"}` response with contextual explanation referencing the SSN-leak incident below. |
| "Fetch an invalid third-party token" button shows the real 404 | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Screenshot-verified. |
| Incident case study renders the real diff and links to `LESSONS_LEARNED.md` | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Screenshot-verified: the `Promise.all` → sequential-chain diff and the `LESSONS_LEARNED.md` link both render correctly at the bottom of the page. |
| "Re-check now" refreshes status tiles without a full page reload | Not run here | — | Manual check; not exercised by the smoke script. |

## 7. "Why this matters" value callouts

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| A callout renders on every demonstration screen | ✅ Pass (manual, Playwright smoke) | 2026-08-19 | Screenshot-verified on `/` (after the disclaimer), `/apply` step 1 (Veteran information), and all 5 sections of `/under-the-hood`; visually confirmed correct USWDS `usa-summary-box` styling and layout in each case. |
| Callout copy is specific to its screen | ✅ Pass (code review) | 2026-08-19 | Each of the 17 instances (7 wizard steps, landing, physician portal, dashboard, schema, 5 under-the-hood sections) has distinct copy referencing that screen's actual feature — spot-checked during implementation, not generic filler. |
| Callout renders correctly with USWDS styling | ✅ Pass | 2026-08-19 | Covered by `npm run test:a11y` (no new violations from the `role="region"`/`aria-labelledby` markup) and confirmed visually. |
| Wizard step callouts survive Back/Continue navigation | Not run here | — | Manual check; not exercised by the automated suite or this pass's smoke script (which only visited step 1). |
| Physician portal and dashboard callouts | Not run here | — | Physician portal needs a freshly generated `/third-party/<token>` link; dashboard needs a signed-in Google session — neither available in this environment. |

## 8. Deployment / environment

| Test | Result | Date | Notes |
| --- | --- | --- | --- |
| Fresh Neon branch self-migrates | Not run here | — | Requires a real Postgres branch; this environment has no `DATABASE_URL` configured. |
| Production requires real `AUTH_SECRET` | ✅ Pass (partially observed) | 2026-08-19 | `npm run test:a11y`'s production build/start confirmed auth routes error loudly (`MissingSecret`) without the env var set, consistent with the documented behavior; the dev-mode fallback path wasn't separately re-verified this pass. |
| Preview vs. production URL auth behavior | Not run here | — | Requires an actual Vercel deployment; not exercised from this environment. |
| No unauthenticated route leaks claimant data | Not run here | — | Needs a manual route-by-route audit; last confirmed fixed per `LESSONS_LEARNED.md` (`GET /api/submissions`). |
