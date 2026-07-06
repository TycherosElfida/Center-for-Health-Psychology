# LENGAN 1 — Exhaustive Coverage Verification Suite: Report

**Branch:** `test/lengan1-exhaustive-coverage` · **Base:** `fbcbac35d2d28c4f5337cbf359ece93bb5cc2904` (the frozen commit declared in `FREEZE_RECORD.md` §3 — verified complete, no unfilled placeholders) · **Date:** 2026-07-06

Arm 1 of the two-arm validation study: synthetic, deterministic tests proving the scoring engine correctly implements every configured scoring rule and boundary case across all four instruments. These are **characterization tests of frozen behavior** — not TDD. No engine or production file was modified; every test was written to the ground-truth tables (live-DB audit `docs/PROJECT_SCAN_FINDINGS.md` §5; `FREEZE_RECORD.md` §1–2) and run against the engine as-is.

## 1. Result summary

**All 192 new tests are GREEN against the frozen engine. Zero failures → zero findings to escalate.** Full suite, lint, and typecheck clean.

| | Baseline (fbcbac3) | After Lengan 1 | Added |
|---|---|---|---|
| PSS-10 (`lengan1-pss10.test.ts`) | — | 39 | +39 |
| GPIUS-2 (`lengan1-gpius2.test.ts`) | — | 52 | +52 |
| SRQ-29 (`lengan1-srq29.test.ts`) | — | 20 | +20 |
| SRS (`lengan1-srs.test.ts`) | — | 53 | +53 |
| Validation fns (`lengan1-validation.test.ts`) | — | 28 | +28 |
| **Total** | **231 tests / 29 files** | **423 tests / 34 files** | **+192 / +5** |

Note: the task brief expected a 213-test/25-file baseline; the actual baseline at the frozen commit is **231/29** (both figures from real `pnpm test` runs, below). The brief's figure was stale, as it anticipated it might be.

### Phase 4 verification output (verbatim)

```
 Test Files  34 passed (34)
      Tests  423 passed (423)
   Start at  14:22:21
   Duration  33.00s
```

`pnpm lint` → exit 0 (no output). `npx tsc --noEmit` → exit 0 (no output).

Baseline run at fbcbac3 before any test was added:

```
 Test Files  29 passed (29)
      Tests  231 passed (231)
   Start at  14:10:36
   Duration  32.67s
```

## 2. Freeze safety proof

`git diff --stat fbcbac3..HEAD` (merge-base of this branch and `master` **is** fbcbac3):

```
 src/__tests__/scoring/lengan1-fixtures.ts        | 153 ++++++++++++++++
 src/__tests__/scoring/lengan1-gpius2.test.ts     | 216 ++++++++++++++++++++++
 src/__tests__/scoring/lengan1-pss10.test.ts      | 183 +++++++++++++++++++
 src/__tests__/scoring/lengan1-srq29.test.ts      | 166 +++++++++++++++++
 src/__tests__/scoring/lengan1-srs.test.ts        | 221 +++++++++++++++++++++++
 src/__tests__/scoring/lengan1-validation.test.ts |  91 ++++++++++
 6 files changed, 1030 insertions(+)
```

**Only test files. Zero production files touched.** (A plain `git diff --stat master` additionally shows `FREEZE_RECORD.md` and `docs/keterbatasan-platform-chp.md` — that is because `master` is two docs-only commits *ahead* of the frozen base this branch deliberately roots at, not because this branch touched them.)

Branch commits (`git log --oneline master..HEAD`, before this report's commit):

```
684b886 test(scoring): boundary coverage for validateAnswerValues/validateCompleteness (Lengan 1)
b970810 test(scoring): exhaustive boundary coverage for SRS (Lengan 1)
e746d03 test(scoring): exhaustive boundary coverage for SRQ-29 (Lengan 1)
ecbc5eb test(scoring): exhaustive boundary coverage for GPIUS-2 (Lengan 1)
478d3ec test(scoring): exhaustive boundary coverage for PSS-10 (Lengan 1)
```

(The commit adding this report file follows those five.) The branch is left unmerged; merge/keep/discard is the owner's decision.

## 3. Method (and its stated limits)

- **Fixtures come from the repo's seed-source config** (`src/lib/data/questions.ts`, `src/lib/data/interpretations.ts`), the in-repo copy of the frozen DB configuration; expected values come **only from the ground-truth tables** (never copied from the data files, so a config error surfaces as a test failure rather than being baked into expectations). Structural tests additionally pin the config itself (item counts, dimension sets, reversed sets, option ranges) to the ground truth.
- **Band classification** uses `classify()` in `lengan1-fixtures.ts`, an in-memory equivalent of `lookupInterpretation`'s WHERE clause (`src/server/scoring/interpretation.ts:29-41`): dimension exact-match — or (NULL|'total') when omitted — with **inclusive** minScore/maxScore bounds. Limit: the SQL itself is not executed (this suite is DB-free by design, like the entire existing suite); the equivalence is documented, and the query-shape behavior of `lookupInterpretation` remains covered by the pre-existing `src/tests/scoring/lookupInterpretation.test.ts`.
- **Seed↔DB parity assumption:** the live DB is authoritative in production. Parity between the seed-source files and the DB was verified at freeze time (scan §5 Q2–Q4; FREEZE_RECORD §1–2). One known divergence, handled explicitly: **the SRQ-29 seed items carry no `dimension` field** — the domain tags exist only in the DB — so the fixture overlays the DB-verified mapping (items 1–20 neurotic, 21 substance, 22–24 psychotic, 25–29 ptsd; `srq29Domain()` in `lengan1-fixtures.ts`).
- **Pattern construction:** boundary answer patterns are built in post-reversal "scored" space and converted to raw answers; the conversion is independently pinned by 32 explicit `reverseScore` tests with hand-written expected pairs, and every pattern is re-verified by asserting the engine's computed total/dimension score equals the target **before** classifying. Each instrument also carries at least one fully hand-written raw-answer **anchor** test with the arithmetic spelled out in comments.
- **Non-tautology spot-checks** were performed per instrument while writing (mentally swapping the expected value and confirming the test would then fail) — e.g. PSS-10 total 14→"low" would fail against the 14–26 moderate band; GPIUS-2 DSR=CP+MR (18) would fail against the engine's 14; SRQ-29 neurotic 6→"low" would fail against the 6–20 flagged band; SRS item-1 raw 1→1 would fail against the engine's 6.
- **Beyond the brief:** each instrument gets a full-range *sweep* asserting every achievable integer score matches **exactly one** band under lookup semantics (no gaps, no overlaps) — subsuming "both sides of every boundary" at classification level; the explicit boundary rows remain as the traceable per-cutoff evidence.

## 4. Checklist (Phase 2 plan → outcome)

Marks: ✅ PASS (green against the frozen engine). No row failed; nothing was flagged. Files live in `src/__tests__/scoring/`.

### PSS-10 — `lengan1-pss10.test.ts` (39 tests) — audit risk LOW

| # | Case | Where | Mark |
|---|---|---|---|
| P1 | Structure: 10 items, reversed {4,5,7,8}, options 0–4 | `lengan1-pss10.test.ts:33` | ✅ |
| P2 | Dimensions: Helplessness {1,2,3,6,9,10}, Self-Efficacy {4,5,7,8} | `:42` | ✅ |
| P3 | Reversal `it.each` ×12: items 4,5,7,8 × (0→4, 4→0, 2→2) on real options | `:51-66` | ✅ |
| P4 | Total bands ×6: 0,13→low; 14,26→moderate; 27,40→high (+ labels Stres Rendah/Sedang/Tinggi) | `:71-85` | ✅ |
| P5 | Anchor, explicit raw answers hitting total 14 through reversed items | `:87` | ✅ |
| P6 | Helplessness bands ×6: 0,8→low; 9,16→moderate; 17,24→high | `:99-111` | ✅ |
| P7 | Self-Efficacy bands ×6: 0,5→low; 6,10→moderate; 11,16→high (severity rises with score) | `:117-129` | ✅ |
| P8 | Extreme min: total 0, dims 0/0, maxPossible 40, dimMax {24,16}, all bands low | `:133` | ✅ |
| P9 | Extreme max: total 40, dims 24/16, all bands high | `:145` | ✅ |
| P10 | Literal raw all-0 → total 16 (reversal characterization, hand-computed) | `:155` | ✅ |
| P11 | Literal raw all-4 → total 24 | `:162` | ✅ |
| P12 | Sweep: totals 0–40 exactly one band each | `:171` | ✅ |
| P13 | Sweep: Helplessness 0–24, Self-Efficacy 0–16 exactly one band each | `:175` | ✅ |

### GPIUS-2 — `lengan1-gpius2.test.ts` (52 tests) — audit risk LOW (highest confidence)

| # | Case | Where | Mark |
|---|---|---|---|
| G1 | Structure: 15 items, zero reversed, options 1–5 | `lengan1-gpius2.test.ts:35` | ✅ |
| G2 | Interleaved Caplan dims: POSI {1,6,11}, MR {2,7,12}, CP {3,8,13}, CU {4,9,14}, NO {5,10,15} | `:43` | ✅ |
| G3 | isReversed=false no-op: perQuestion ≡ raw for all 15 items (non-uniform pattern) | `:53` | ✅ |
| G4 | Total bands ×6: 15,43→low; 44,58→moderate; 59,75→high | `:67-79` | ✅ |
| G5 | Anchor, explicit raw answers hitting total 44 | `:81` | ✅ |
| G6 | Subscale bands `it.each` ×30: both sides of every boundary + floor/ceiling for POSI (7|8, 11|12), MR (10|11, 13|14), CP (8|9, 12|13), CU (9|10, 12|13), NO (7|8, 11|12) | `:94-131` | ✅ |
| G7 | DSR = CP+CU exactly; explicitly ≠ CP+MR, ≠ CU+MR, ≠ CP+CU+MR (distinct sums 5/9/13) | `:134` | ✅ |
| G8 | DSR max = 30 with real fixture | `:148` | ✅ |
| G9 | DSR bands ×6: 6,17→low; 18,24→moderate; 25,30→high | `:155-168` | ✅ |
| G10 | Extreme all-1: total 15, subscales 3, DSR 6, dimMax all 15/DSR 30, all bands low | `:171` | ✅ |
| G11 | Extreme all-5: total 75, subscales 15, DSR 30, all bands high | `:191` | ✅ |
| G12 | Sweeps: totals 15–75, subscales 3–15 ×5, DSR 6–30 — exactly one band each | `:204`, `:208` | ✅ |

### SRQ-29 — `lengan1-srq29.test.ts` (20 tests) — audit risk LOW-MEDIUM

| # | Case | Where | Mark |
|---|---|---|---|
| S1 | Structure: 29 items, binary 0/1, zero reversed | `lengan1-srq29.test.ts:42` | ✅ |
| S2 | Domains (DB-verified overlay): neurotic {1–20}, substance {21}, psychotic {22–24}, ptsd {25–29} | `:50` | ✅ |
| S3 | Neurotic ×4: 0,5→low (Normal); **6→high (Kemenkes GME ≥6 threshold)**; 20→high — other domains stay 0 | `:61-74` | ✅ |
| S4 | Anchor: exactly items 1–6 = Yes → neurotic 6, flagged band's minScore is exactly 6 | `:76` | ✅ |
| S5 | psychotic ×3 (0→low; 1,3→high), ptsd ×3 (0→low; 1,5→high), substance ×2 (0→low; 1→high) | `:88-102` | ✅ |
| S6 | No total band configured for srq29 (zero null/'total' rows) — by design | `:106` | ✅ |
| S7 | Total-score classification misses for every sum 0–29 (submitAssessment's guard `sessions.ts:365-382` is not reachable as a pure function; asserted at config level) | `:113` | ✅ |
| S8 | Extreme all-0: all domains 0, all bands Normal/low | `:122` | ✅ |
| S9 | Extreme all-1: {20,1,3,5} fully flagged; arithmetic total 29 exists but carries no interpretation | `:133` | ✅ |
| S10 | Sweep: every integer domain score exactly one band | `:154` | ✅ |

### SRS — `lengan1-srs.test.ts` (53 tests) — audit risk **HIGH** (see §5)

| # | Case | Where | Mark |
|---|---|---|---|
| R1 | Structure: 11 items, reversed {1,3,5,7,11}, options 1–6 | `lengan1-srs.test.ts:43` | ✅ |
| R2 | Dimensions: Control {1,3,5,7,11} (identical to the reversed set), Efficacy {6,8,10}, Satisfaction {2,4,9} | `:52` | ✅ |
| R3 | Reversal `it.each` ×20: items 1,3,5,7,11 × (1→6, 6→1, 3→4, 4→3) on real options | `:62-86` | ✅ |
| R4 | Total bands ×6, inverted polarity: 11,33→**high**; 34,50→moderate; 51,66→**low** | `:91-103` | ✅ |
| R5 | Anchor, explicit raw answers hitting total 34 through reversed items | `:105` | ✅ |
| R6 | Control bands ×6: 5,13→high; 14,22→moderate; 23,30→low (exercises reversal in computeScore) | `:120-133` | ✅ |
| R7 | Efficacy bands ×6: 3,8→high; 9,14→moderate; 15,18→low | `:136-149` | ✅ |
| R8 | Satisfaction bands ×6: same boundaries as Efficacy | `:152-165` | ✅ |
| R9 | Extreme scored-min: total 11 {C5,E3,S3}, maxPossible 66, dimMax {30,18,18}, all bands high severity | `:168` | ✅ |
| R10 | Extreme scored-max: total 66 {C30,E18,S18}, all bands low severity | `:181` | ✅ |
| R11 | Literal raw all-1 → total 36 (Control reverses to 30) — hand-computed | `:192` | ✅ |
| R12 | Literal raw all-6 → total 41 (Control reverses to 5) | `:199` | ✅ |
| R13 | Sweeps: totals 11–66, Control 5–30, Efficacy/Satisfaction 3–18 — exactly one band each | `:208`, `:212` | ✅ |

### Validation functions — `lengan1-validation.test.ts` (28 tests)

| # | Case | Where | Mark |
|---|---|---|---|
| V1 | `validateAnswerValues` ×4 instruments (`describe.each`): full set at valid min accepted; at valid max accepted; min−1 rejected; max+1 rejected — i.e. PSS-10 accepts 0/4 rejects −1/5; GPIUS-2 accepts 1/5 rejects 0/6; SRQ-29 accepts 0/1 rejects −1/2; SRS accepts 1/6 rejects 0/7 | `lengan1-validation.test.ts:29-59` | ✅ |
| V2 | `validateCompleteness` ×4 instruments: full set (10/15/29/11) passes; missing exactly the FIRST item fails; missing exactly the LAST item fails | `:64-90` | ✅ |

## 5. SRS caveat (reporting rule — restated verbatim)

> For SRS specifically: these tests verify the *currently configured* behavior only — not that the configuration itself is psychometrically valid. The three-subscale structure and the 12→11 item reduction are not independently verifiable via public literature and remain pending direct domain-expert confirmation. Nothing in this suite should be worded to imply SRS's scoring rules have been externally validated.

The same caveat is embedded in the `lengan1-srs.test.ts` file header so it travels with the code.

## 6. Failures encountered

**None.** No new test ever failed against the frozen engine at any point during Phases 3–4, so no finding required escalation and nothing was "made to pass" by editing a test or the engine. (Had one failed, the protocol was: stop, report input/expected/actual, leave unresolved for the owner.)

## 7. Traceability

Every boundary table carries a source comment in its `describe`/file header: PSS-10 → Cohen, Kamarck & Mermelstein (1983) + Hakim et al. (2024) JP3I 13(2):117–129; GPIUS-2 → Caplan (2010) + Reynaldo & Sokang (2016) mean-anchored bands; SRQ-29 → WHO SRQ (Beusenberg & Orley 1994) + Kemenkes GME ≥6; SRS → configured behavior only (see §5). All band values additionally cite the live-DB audit (`PROJECT_SCAN_FINDINGS.md` §5 Q2–Q4) and `FREEZE_RECORD.md` §1–2. A methodology claim in the paper can therefore be traced to a named test at a file:line in §4.
