---
name: basic_code
description: Keeps this repo's four project docs — USER_GUIDE.md, TEST_PLAN.md, TEST_RESULTS.md, and LESSONS_LEARNED.md — in sync with whatever code just changed. Use this at the end of any coding task in this repo (a new feature, a bugfix, a refactor, wiring up tests) even if the user didn't explicitly ask for documentation — these docs should never be allowed to drift from the code. Trigger on phrasing like "wrap this up", "I'm done with this change", "ship it", "update the docs", or any request to finish/complete a task that touched app/, components/, lib/, or tests/. Also trigger when asked directly to write or refresh the user guide, test plan, test results, or lessons learned.
---

# Keeping the project docs current

This repo tracks its own state in four files at the repo root, and none of
them are optional extras — together they're the difference between a
proof-of-concept a stranger can pick up and one only the last person to
touch it understands. Bring all four current before considering a coding
task finished:

| File | Answers | Status |
| --- | --- | --- |
| `USER_GUIDE.md` | "How do I use this?" | exists — update in place |
| `TEST_PLAN.md` | "What should be tested, and how?" | create if missing |
| `TEST_RESULTS.md` | "Did it pass, and when did we last check?" | create if missing |
| `LESSONS_LEARNED.md` | "What broke, and how was it fixed?" | exists — update in place |

Read whichever files already exist before writing anything — match their
existing voice (plain prose, second person for the guide, past tense for
lessons, em dashes over bullets-of-fragments) instead of starting a
different style partway down the same document. Never create a second
top-level doc for something a section already covers (no `USER_GUIDE2.md`,
no duplicate "## Testing" section) — find the right existing section and
extend it, or add a new section in the established structure.

## 1. Work out what actually changed

Before writing anything, ground the update in the real diff, not memory of
the conversation:

```bash
git status
git diff main...HEAD      # or: git diff <base-branch>...HEAD
git log --oneline main...HEAD
```

Pay attention to three different kinds of change, since each doc cares
about a different one:

- **User-visible behavior** (new page, new field, changed flow, changed
  copy) → `USER_GUIDE.md` needs updating.
- **New testable surface** (new route, new component, new edge case, new
  a11y/lint gate) → `TEST_PLAN.md` needs a new row or section.
- **Anything that broke during this session and got fixed** — a failing
  test, a crash, a wrong assumption about a library, a bad config — →
  `LESSONS_LEARNED.md` needs an entry, regardless of whether it also
  touches the other two files.

If nothing user-visible changed (pure refactor, internal cleanup) it's
fine for `USER_GUIDE.md` to need no edit — don't force a change into a doc
that has nothing new to say. The same is not true of `LESSONS_LEARNED.md`
whenever something went wrong along the way, even if the end state looks
clean.

## 2. `USER_GUIDE.md` — update in place

Audience: the Veteran/claimant, the physician, and VA/Ad Hoc staff (see
the file's own intro for the exact breakdown). For each user-visible
change, find the numbered section for that audience/flow and edit its
steps directly, rather than appending a changelog entry at the bottom —
this file describes the *current* app, not its history. Add a row to the
Troubleshooting table at the end for any new failure mode a user could
hit.

## 3. `TEST_PLAN.md` — create if missing, else update

This describes what *should* be verified, independent of whether it was
just run. Group by the same audiences/flows the user guide uses so the
two documents stay easy to cross-reference. For each testable area,
capture:

- **What to test** — the scenario or behavior in plain language.
- **How** — manual steps, or the automated check that covers it (e.g. "`npm run test:a11y` — `tests/a11y.spec.ts`", "`npm run lint`", "`npm run build`"). Point at the actual command/spec file so this stays a living index of the test suite instead of a wishlist.
- **Priority/type** — smoke vs. regression vs. edge case, if useful for someone deciding what to run under time pressure.

When code changes add a new route, component, or edge case, add a row here
in the same pass — a test plan that only covers what existed at project
kickoff stops being useful within a month.

## 4. `TEST_RESULTS.md` — create if missing, else update

This is the *last known outcome* for each item in `TEST_PLAN.md`, not a
running log of every historical run — update each row's result and date
in place rather than appending a new row for the same test every time.
Structure it as a table: test / area → result (pass, fail, blocked) → date
→ notes (e.g. what failed, what environment).

Before writing results, actually run what you can:

```bash
npm run lint
npm run build
npm run test:a11y   # requires the Playwright browser present in this environment
```

If a check can't run in the current environment (no browser, no live DB),
say so in the notes rather than guessing at a result — a fabricated "pass"
is worse than an honest "not run here, needs a manual check." If you fixed
something this session specifically because a test failed, that failure
and its resolution belongs primarily in `LESSONS_LEARNED.md`; the
corresponding `TEST_RESULTS.md` row should just reflect the current
(passing) state after the fix.

## 5. `LESSONS_LEARNED.md` — update in place, append a new section

Organized by theme, not chronology (see the existing headers — this
matters: a future reader searching for "Next.js" or "auth" should find the
relevant lesson without scanning dates). For each new issue hit and fixed
this session, add a new `##` section (or extend an existing themed section
if the new issue is a close relative of one already there) covering:

- What broke, concretely enough that someone hitting the same symptom
  would recognize it.
- The root cause — not just the symptom.
- The actual fix, and why it's the right fix (not a workaround that will
  resurface).

Skip this step only if the entire session went smoothly with nothing
worth warning the next person about — that's a genuinely valid outcome,
not a corner being cut.

## 6. Sanity check before finishing

Re-read the diff across all four files together: does the user guide
describe what the code now does, does the test plan cover what the diff
touched, do the test results reflect an actual run (or an honest "couldn't
run this here"), and does lessons-learned capture anything that actually
went wrong? A doc update that was rushed to check a box is worse than
skipping a file that genuinely had nothing new to say — but "nothing to
say" should be the conclusion of looking at the diff, not the default.
