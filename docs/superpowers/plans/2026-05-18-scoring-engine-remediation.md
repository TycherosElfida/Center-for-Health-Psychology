# Implementation Plan — Scoring Engine Clinical Remediation

**Date:** 2026-05-18
**Context:** Phase 3 Planning for the scoring engine remediation defined in `docs/superpowers/specs/2026-05-08-scoring-engine-clinical-references-design.md`.

## Execution Mode
We will use **Subagent-Driven Development** (or TDD within this session) to execute these tasks, ensuring all changes are covered by tests before completion.

## Tasks

### 1. Update `Question` Interface and Static Data
- **Objective:** Allow static question definitions to declare their dimensional mapping.
- **Files:** `src/lib/data/questions.ts`
- **Actions:**
  - Add `dimension?: string;` to the `Question` interface.
  - Update `gpius2` questions with the interleaved mappings: POSI (1,6,11), MR (2,7,12), CP (3,8,13), CU (4,9,14), NO (5,10,15).
  - Update `pss10` questions with two-factor dimensions: Helplessness (1,2,3,6,9,10) and Self-Efficacy (4,5,7,8).
  - Verify and update `srs` dimensions: Efficacy (6,8,10), Satisfaction (2,4,9), Control (1,3,5,7,11).
  - Write/update tests to assert the correctness of these arrays (e.g. `src/__tests__/data/questions.test.ts`).

### 2. Update Database Seeding Logic
- **Objective:** Ensure new deployments populate dimensions correctly.
- **Files:** `src/server/db/seed.ts`
- **Actions:**
  - Update the question insertion loop to prioritize `qData.dimension` if present, falling back to dynamic `SRQ29_DIMENSIONS` for `srq29`.

### 3. Implement Database Remediation Script
- **Objective:** Update existing `questions` rows in the Neon database with the correct dimensions from `QUESTIONS` without running a destructive seed.
- **Files:** `scripts/remediate-dimensions.ts`
- **Actions:**
  - Create a script that iterates over `gpius2`, `pss10`, and `srs` in `QUESTIONS`.
  - Fetch corresponding questions from the DB by `testId` and `order`, and update their `dimension` column.
  - Execute this script locally against the DB.

### 4. Enhance Scoring Engine with Second-Order DSR
- **Objective:** Add the Deficient Self-Regulation (DSR) second-order subscale for GPIUS-2.
- **Files:** `src/server/scoring/engine.ts`
- **Actions:**
  - Add a post-processing step in `computeScore` that checks if the `CP` and `CU` dimensions exist in the results. If so (for GPIUS-2), compute `DSR = CP + CU`.
  - Add test cases in `src/__tests__/scoring/engine.test.ts` to verify the DSR computation logic.

### 5. Rescore Existing Results (If Required)
- **Objective:** Backfill the `dimensionScores` for any existing results that were computed with `null` dimensions.
- **Files:** `scripts/remediate-scores.ts`
- **Actions:**
  - Create a script to fetch all `results` for `gpius2`, `pss10`, and `srs`.
  - Recalculate `dimensionScores` using the updated questions.
  - Update the `results` table via batch `update`.
  - Execute this script locally.

### 6. Verification and Cleanup
- **Objective:** Ensure all specs and tests pass, and no regressions exist.
- **Actions:**
  - Run `pnpm test` and ensure `100%` green.
  - Review that citations are updated in the DB (`tests` table and `resultInterpretations`).
