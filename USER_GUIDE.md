# User Guide

This guide covers the three audiences who touch the Lifestage Benefits
Optimization proof-of-concept: the Veteran/claimant filling out the
interview, the physician completing a routed exam form, and VA/Ad Hoc staff
watching the observability dashboard. For what the system is and why it's
built this way, see `README.md` and the design doc in `docs/`.

**Live demo:** https://lifestage-benefits-demo.vercel.app

> Preview URLs (the ones posted automatically on each pull request) sit
> behind Vercel's team sign-in and will bounce anyone outside the Ad Hoc
> Vercel team to a Vercel login page — that's expected, not a bug. The
> production URL above does not require a Vercel account. `/dashboard`
> still requires its own Google sign-in (see below) regardless of which
> URL you're on.

## 1. Claimant / Veteran: the Lifestage interview

Start at the live demo URL and click **Start application** (or go directly
to `/apply`). The interview is seven steps, each saved as you go — you can
use **Back** without losing anything you already entered:

1. **Veteran information** — name, date of birth, date of death (if
   applicable), branch of service.
2. **Claimant information** — who's filing (the Veteran, a spouse, a
   surviving spouse, etc.) and their relationship.
3. **Dependents** — add or remove dependents inline; each one asks whether
   they have a Social Security number.
4. **Aid & Attendance screening** — a yes/no question that, if yes, asks
   for a short description.
5. **Evidence & extraction** — upload a document (any file works; this is
   a demo, not real OCR — see below) and watch it come back as a table of
   extracted fields, each with a confidence score. Anything under 85%
   confidence is flagged **Needs review**; you can edit any field's value
   directly in the table before continuing.
6. **Physician routing (optional)** — if this claim needs a physician exam
   (VA Form 21-2680), click **Send secure link to physician** to generate
   a one-time link. Copy it and send it to whoever needs to complete the
   exam — see Section 2 below for what they'll see.
7. **Review & submit** — a read-only summary of everything entered.
   **Submit application** finalizes the record and takes you to a
   confirmation page with a confirmation number.

**About the extraction step:** the confidence scores and extracted values
are a deterministic mock standing in for real AI/OCR (see design doc
Section 7) — the same file always produces the same fields. It exists to
demonstrate the review-and-correct interaction pattern, not to actually
read documents.

## 2. Physician: completing a routed exam

A physician reaches their form through the one-time link generated in
interview step 6 — a URL like `/third-party/<token>`, no account or
sign-in required. The page shows:

- Which claimant and Veteran the exam is for.
- A form for **Examining physician name**, **Clinical findings**, and a
  **Signature** field (type your full legal name to e-sign).

Clicking **Submit & e-sign** finalizes it. The link:

- Works exactly once — after submission, reopening it shows a
  confirmation message instead of the form.
- Expires after 7 days if never used.
- Immediately updates the claimant's submission status and the staff
  dashboard's transaction trace — there's no polling or refresh needed on
  either side; the next time either page loads, it reflects the new state.

## 3. Staff: the observability dashboard

`/dashboard` requires signing in with a Google account on the
`adhocteam.us` domain (see design doc Section 8 for why Google, and why
only that domain — this is not the Veteran-facing identity system). If
you're not signed in, you'll be redirected to a Google sign-in page
automatically; sign back out with the link in the dashboard's top-right
corner when you're done.

Once in, you'll see:

- **Six live metrics**: total submissions, how many are complete, how many
  are waiting on a physician, average extraction confidence, the
  third-party completion rate, and the total number of trace events
  recorded system-wide.
- **A claims list** — click any row to load that claim's detail and
  transaction trace on the right.
- **A transaction trace** — every meaningful step (intake, extraction,
  routing, validation, submission) recorded in order with a timestamp, for
  the selected claim. This is what proves a submission didn't silently
  fail somewhere.

The dashboard re-reads the database on every page load rather than
pushing updates live to an open tab — reload to see the latest state.

## 4. Anyone: the published data dictionary

`/schema` (no sign-in required) shows the actual JSON Schema every
submission is validated against, generated directly from the Zod schemas
in `lib/schema.ts`. If you're wondering what fields exist, what's
required, or what a field's exact shape is, this is the source of truth —
it cannot drift from the validation code because it's generated from it.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| A step won't advance and shows a red error banner | The error banner now shows the specific validation failure (e.g. "dependents.0.dateOfBirth: Date of birth is required") — fix that field and continue. |
| Physician's link shows "Link not found or expired" | Either it was already submitted once, or more than 7 days passed since it was issued. Go back to the interview and issue a new one. |
| `/dashboard` redirects to a Google sign-in you can't get past | Your Google account isn't on the `adhocteam.us` domain — the `signIn` callback in `auth.ts` rejects everything else by design. |
| A preview URL (from a pull request) shows a Vercel login page instead of the app | Expected — preview deployments require Vercel team membership. Use the production URL to share the demo outside the team, or ask to be added to the Vercel team to view previews. |
