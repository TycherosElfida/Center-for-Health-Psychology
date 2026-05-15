# Known Limitations — CHP Digital Assessment Platform

**Date:** 2026-05-16
**Context:** Undergraduate internship (Kerja Praktik) deliverable for the Center for Health Psychology at Universitas Kristen Krida Wacana, Jakarta. Scope was frozen by the dean of psychology ahead of the handover meeting on 2026-05-22.
**Lead developer:** Sanders (NIM 412023020)
**Co-developer (UI/UX):** Febriane Veranica

This document is written for whoever picks the codebase up after the handover. It is an honest accounting of what the platform does today, what it does not, and what would need to change for each limitation to go away.

---

## What Works

The primary user journey is **live and operational** for the four canonical instruments (PSS-10, GPIUS-2, SRS, SRQ-29). As of 2026-05-16, the production Neon database holds:

- **41 test sessions** (24 completed, 17 in progress)
- **24 results** with full computed-score snapshots
- **31 explicit consent grants** recorded against PDPL requirements
- **7 report requests** queued through the email-delivery flow
- **8 registered end-users** plus **3 promoted user profiles** (from anonymous claims)
- **6 admin accounts** and **217 audit log entries**

A guest with no account can land on `/tests`, see the four instruments pulled from the database, click into any of them, read a briefing screen, submit personal info (name, sex, age, province, city), answer every question, submit the assessment, and view a results dashboard with a radial gauge, severity-coded interpretation, affirmation messaging, and a clinical disclaimer. They can request an emailed PDF report or claim the result by registering — the anonymous session is then permanently linked to their new account, and their demographics are promoted into a reusable user profile.

The administrative panel at `/admin` supports test lifecycle management (create / publish / archive / revert), question CRUD, interpretation-range CRUD, audit log review, results review and detailed reporting, account management for admin and end users, and a dashboard with usage statistics. All admin mutations are audit-logged.

**Test baseline:** 157 Vitest tests across 21 files, all passing. 0 TypeScript errors under strict mode.

---

## Bucket 1 — Database Architecture Limitations

### L1 — Customer-side questions are served from a static file, not the database

The four canonical instruments work end-to-end today because the question text, option labels, and reversal flags are duplicated in two places that were initialized from the same source: the database (seeded by `pnpm db:seed`) and `src/lib/data/questions.ts`, a static TypeScript module imported by `src/app/test/[slug]/page.tsx`. The page renders questions from the static file. The database copy is used only for scoring at submit time.

**Consequence.** Admin edits to question text, option labels, dimensions, or reversal flags via the QuestionManager UI write to the database but never reach end users. New tests created through the admin "Create Assessment" flow have no entry in `src/lib/data/questions.ts` and therefore cannot be served at all — the route `notFound()`s.

**Fix.** Two changes, both in `src/server/trpc/procedures/public-tests.ts` and `src/app/test/[slug]/page.tsx`. Extend `getTestBySlug` to use a Drizzle relational query with `with: { questions: { with: { options: true } } }`, then refactor `AssessmentForm` (currently consuming the static `Question` shape) to consume the joined DB shape. Existing scoring code already reads from the database, so the scoring side does not change.

**Effort.** 1–3 days, including test refactors.

---

### L2 — GPIUS-2 dimensional scoring is not implemented

The GPIUS-2 `tests` row has `scoring_method='dimensional'`, but all 15 GPIUS-2 questions in the `questions` table have `dimension=NULL`. The scoring engine therefore produces only a flat total in the range 15–75 and looks up a single interpretation band, when the Caplan (2010) instrument defines five interleaved subscales — Preference for Online Social Interaction (POSI), Mood Regulation, Cognitive Preoccupation, Compulsive Internet Use, Negative Outcomes — plus a second-order Deficient Self-Regulation construct.

**Consequence.** The platform administers the correct GPIUS-2 items in the correct order but reports a single coarse number where it should report seven (5 subscales + DSR + total). This is the most significant clinical-fidelity gap.

**Fix.** A SQL UPDATE on `questions.dimension` per the Reynaldo & Sokang (2016) item-to-subscale mapping documented in the parked spec at `docs/superpowers/specs/2026-05-08-scoring-engine-clinical-references-design.md` (sections 2.2–2.4). After tagging dimensions, the existing engine code automatically produces per-dimension scores; only the result page presentation needs minor work to surface them.

**Effort.** 2–4 hours of SQL plus the time to verify the mapping against the full Reynaldo & Sokang PDF.

---

### L3 — PSS-10 and SRS dimensional reporting are missing

Same root cause as L2. PSS-10 has a replicated two-factor structure (Helplessness items 1, 2, 3, 6, 9, 10 / Self-Efficacy items 4, 5, 7, 8). The dean's SRS adaptation defines three subscales (Efficacy items 6, 8, 10 / Satisfaction items 2, 4, 9 / Control items 1, 3, 5, 7, 11). Neither set of dimension tags is present in the database, so the engine returns only a total.

**Fix.** Same procedure as L2 — SQL UPDATE on `questions.dimension` per the mappings in `docs/superpowers/specs/2026-05-08-scoring-engine-clinical-references-design.md` sections 1.3 and 3.4.

**Effort.** Approximately 2 hours per instrument once the dean has signed off on the mapping (the spec already proposes the assignments; sign-off is a clinical decision, not a technical one).

---

## Bucket 2 — Admin Panel Limitations

### L4 — QuestionManager can only create Likert-5 questions

`src/app/admin/(dashboard)/assessments/[id]/_components/QuestionManager.tsx:175-198` hardcodes `type: "likert_5"` and the canonical Strongly-Disagree → Strongly-Agree (0–4) options when an admin clicks "Add Question." The database schema supports `likert_5`, `likert_7`, `multiple_choice`, `slider`, and `multi_select`, but the UI has no type picker. As a result, an admin cannot author the binary Yes/No questions used by SRQ-29 or the 6-point Likert used by SRS through the admin panel.

**Consequence.** The four canonical instruments can be edited cosmetically but new validated instruments must be authored directly via SQL or by extending `src/server/db/seed.ts`.

**Fix.** Add a type dropdown to the question creation/edit form, then render a dynamic option editor whose constraints depend on the chosen type (2 options for binary, 5 for likert_5, 6 for likert_6, 7 for likert_7, free range for multiple_choice).

**Effort.** 1–2 days.

---

### L5 — Question reorder UI is missing

The tRPC procedure `adminQuestions.reorderQuestions` exists and is unit-tested; it accepts a `testId` and an `orderedIds` array, then issues a per-row UPDATE on the `order` column with a structural lock guard for tests that already have sessions. No client code in `QuestionManager.tsx` calls it — there are no drag handles or move-up/move-down buttons. Question order is whatever sequence rows were inserted in.

**Fix.** Integrate `dnd-kit/sortable`, wire the on-drop handler to `reorderQuestions.mutate`, and respect the existing `isLocked` derived state to disable dragging when sessions exist.

**Effort.** 1 day.

---

### L6 — publishTest gate is weak

`src/server/trpc/procedures/admin-tests.ts:333-389` allows publishing a test as soon as `questionCount >= 1`. It does not check that the questions have options attached, nor that any rows exist in `result_interpretations` for the test. An admin could publish a test with a single placeholder question and no interpretation bands; the customer flow would then crash at submit time because the interpretation lookup returns null and the result page renders with empty bands.

**Fix.** Extend the gate to also assert that every question for the test has at least 2 options, and that `result_interpretations` is non-empty for the test (and covers the full theoretical score range for summative tests, or every distinct `dimension` value for dimensional tests).

**Effort.** 1 hour.

---

### L7 — `tests.category` is unvalidated free text

`createTest` and `updateTest` in `src/server/trpc/procedures/admin-tests.ts` accept any non-empty string for the category field. The production database has accumulated dirty values from testing — categories like "sad" alongside "Mental Health", "Stress", and "Internet & Technology". The customer-facing catalog derives its filter pills from `selectDistinct(category)`, so any typo creates a new visible pill until cleaned up.

**Fix.** Either constrain the field to a fixed enum at the Zod schema level, or convert it to a foreign key against a new `categories` table managed via the admin panel.

**Effort.** 30 minutes for the enum approach; ~3 hours for the FK refactor.

---

## Bucket 3 — Scoring Engine & Clinical Fidelity

### L8 — Interpretation bands are heuristic tertiles, not validated cutoffs

The thresholds shipped for PSS-10 (0–13 Low / 14–26 Moderate / 27–40 High), SRS (11–33 / 34–50 / 51–66), and GPIUS-2 (15–34 / 35–52 / 53–75) are simple tertile divisions of each instrument's theoretical range. None are sourced from a normative validation study. Cohen et al. did not publish official PSS-10 cutoffs. Caplan did not publish GPIUS-2 cutoffs. Manning et al. treated SRS as a continuous measure with no thresholds.

**Consequence.** Result-page interpretations are reproducible from the literature but lack a defensible citation. Acceptable for a screening tool with the existing clinical disclaimer; not acceptable for clinical decision-making.

**Status.** The dean explicitly deferred resolution of this until after the handover. The four canonical instruments will retain the existing heuristic bands.

---

### L9 — Full clinical references remediation is parked

A complete remediation specification exists at `docs/superpowers/specs/2026-05-08-scoring-engine-clinical-references-design.md`. It audits each of the four instruments against the published literature, documents the correct item-to-subscale mappings (most importantly the **interleaved** GPIUS-2 subscale structure — POSI items 1/6/11, not 1/2/3), proposes corrected citation chains, and lists action items per instrument.

The remediation is parked because L1–L4 above must be addressed first for the changes to reach end users, and because some action items (e.g., verifying GPIUS-2 cutoffs against the Reynaldo & Sokang 2016 PDF) require access to the source paper.

**Reference.** Read sections 1.6, 2.3, 2.6, 3.4, 3.5, and 4 of the spec for the per-instrument action items.

---

### L10 — `scoring_rules` table is empty and unused

The Drizzle schema defines a `scoring_rules` table with a CASCADE foreign key on `tests.id`. The migrations create the table. Nothing reads from it and nothing writes to it. The original intent was a DB-driven scoring DSL; the actual implementation encodes scoring logic in TypeScript (`engine.ts`) plus per-question `is_reversed` / `dimension` / `weight` columns on `questions`.

**Fix.** Either populate the table with the eventual DB-driven rule set when L9 is addressed, or drop the table in a migration. The table is harmless as-is; it is documented architectural debt.

---

### L11 — Session anonymity hashes use base64, not a real hash

`src/server/trpc/procedures/sessions.ts:105-106` stores `ipHash` and `userAgentHash` by passing the raw values through `btoa()`. The column names imply cryptographic hashing but base64 is reversible — anyone with the encoded value can recover the original IP or user-agent in a single line of code.

**Consequence.** The PDPL anonymity claim made by the platform is cosmetic. Whether this matters depends on the threat model; for a screening tool with explicit consent and no claim of de-anonymized aggregation, it is acceptable.

**Fix.** Replace `btoa(value)` with `createHash('sha256').update(value).digest('hex')` from Node's `crypto`. One-line change; no migration needed because existing rows can remain as-is (the columns are advisory).

**Effort.** 1 hour including a test that verifies the hash output format.

---

## Bucket 4 — Infrastructure & Future Features

### L12 — No Playwright end-to-end tests

`@playwright/test` is in `devDependencies` but no test files exist and there is no `playwright.config.ts`. Coverage of integration behavior relies on Vitest unit tests (157 passing) plus manual smoke testing.

**Fix.** Add `playwright.config.ts`, a `tests/e2e/` directory, and at minimum these golden-path scenarios: guest completes PSS-10 end-to-end, guest claims session after registration, admin logs in and publishes a draft test.

**Effort.** 1–2 days.

---

### L13 — Tier 2 features were never built

The original specification listed a Tier 2 feature set estimated at approximately 26 hours of work: Google OAuth sign-in, email verification on registration, password reset flow for end users, longitudinal score tracking UI (historical results for repeat-takers), and a manual guest-to-user migration UI for admins. None of these were built. The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables exist as remnants of the planned Google OAuth integration but no code reads them.

**Status.** Deferred per the dean's scope freeze. The custom-credential Auth.js flow covers the minimum viable user-account requirement.

---

### L14 — `submitAssessment` is not atomic

The neon-http driver in use does not support transactions. `src/server/trpc/procedures/sessions.ts:362-381` therefore writes the `test_sessions.status='completed'` UPDATE and the `results` INSERT as two separate statements. A crash between them would leave a session marked completed with no corresponding result row. An idempotency guard at the top of the procedure protects against duplicate scoring on retry.

**Observed risk.** Zero — across 41 sessions and 24 results in production no orphans have been detected.

**Fix.** Switch the Drizzle driver to `drizzle-orm/neon-serverless` (WebSocket transport), which supports `db.transaction(...)`. Performs slightly slower per query but allows atomicity. Alternatively, add a reconciliation script that periodically scans for `test_sessions.status='completed' WITHOUT matching results` and either retries scoring or reverts the session to `in_progress`.

**Effort.** Half a day to switch drivers and re-test; less to add a reconciliation script.

---

## Conscious Architecture Decisions (Not Bugs)

Three choices in this codebase routinely look like bugs to first-time readers but are intentional:

**1. Two separate authentication systems.** The end-user flow uses Auth.js v5. The admin panel uses a custom JWT issued and verified with `jose`. They share no cookies, no DB tables, and no session storage. This is deliberate: a bug in either system cannot escalate privileges into the other. Do not "consolidate" them under a single auth library — the isolation is a security property, not technical debt.

**2. `pnpm db:push` instead of tracked migrations.** The `drizzle/` migrations directory exists but is not the day-to-day workflow. Schema changes happen by editing `src/server/schema/*.ts` and running `pnpm db:push`, which diffs the live schema and applies the difference. This was accepted to move quickly during the internship and works against Neon's free-tier branching. For a long-lived production system you would want to commit to the migration workflow (`pnpm db:generate` → review → `pnpm db:migrate`); the infrastructure is already there.

**3. Static `src/lib/data/questions.ts` as the customer-side question source.** When the codebase was bootstrapped, the static file and the DB seed read from the same source, so they were in sync by construction. As the admin CRUD grew (1D phase), the static file became a limitation rather than an optimization. It is documented as L1 above. Do not delete the static file without first wiring the DB-driven path (L1 fix) — the customer flow currently depends on it.

---

## Recommended Next Priorities

Ordered for whoever picks this up after the handover:

1. **Wire DB-driven question serving (L1).** This single change unblocks the entire admin-edit promise. Without it, every other admin feature has a "but it does not actually reach users" caveat.
2. **GPIUS-2 dimension tagging (L2).** 2–4 hours, highest clinical value for the time investment. The platform is already collecting the data correctly; it just is not reporting it.
3. **PSS-10 and SRS dimension tagging (L3).** Approximately 2 hours each once the mapping is approved.
4. **QuestionManager type picker (L4).** Until this lands, no new validated instrument can be authored from the admin UI.
5. **Playwright end-to-end tests (L12).** Closes the testing gap left by the deferral.
6. **Full scoring-engine clinical references remediation (L9).** Requires the dean's sign-off on the parked specification at `docs/superpowers/specs/2026-05-08-scoring-engine-clinical-references-design.md` before any code changes.

Smaller items (L6, L7, L11, L14) are good warm-up tasks for the next developer — each is well-scoped, has a clear definition of done, and can be merged independently.
