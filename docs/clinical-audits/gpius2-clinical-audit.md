# GPIUS-2 — Clinical Audit Document

**Instrument:** Generalized Problematic Internet Use Scale 2 (GPIUS-2)  
**Audit Date:** 2026-05-19  
**Branch:** `gpius2-interpretation-scheme`  
**Spec Reference:** v2 Clinical Reference Specification §2 (2026-05-08)  
**Status:** 🟢 ALL ISSUES RESOLVED

---

## 1. Instrument Overview

| Property | Value |
|---|---|
| **Original Author** | Scott E. Caplan |
| **Year** | 2010 |
| **Indonesian Adaptation** | Reynaldo, R., & Sokang, Y. A. (2016) |
| **Adaptation Source** | Universitas Kristen Krida Wacana (UKRIDA) |
| **Items** | 15 |
| **Scale** | Likert 5-point (1–5) |
| **Total Score Range** | 15–75 |
| **Reversed Items** | None |
| **Scoring Method** | Summative |

## 2. Dimensional Structure

The GPIUS-2 measures five dimensions of problematic internet use based on Caplan's cognitive-behavioral model:

| Dimension | Abbreviation | Items | Score Range |
|---|---|---|---|
| Preference for Online Social Interaction | POSI | Q1, Q6, Q11 | 3–15 |
| Mood Regulation | MR | Q2, Q7, Q12 | 3–15 |
| Cognitive Preoccupation | CP | Q3, Q8, Q13 | 3–15 |
| Compulsive Use | CU | Q4, Q9, Q14 | 3–15 |
| Negative Outcomes | NO | Q5, Q10, Q15 | 3–15 |

### Second-Order Dimension: Deficient Self-Regulation (DSR)

| Dimension | Composition | Score Range |
|---|---|---|
| Deficient Self-Regulation (DSR) | CP + CU | 6–30 |

DSR is a derived score calculated as the sum of Cognitive Preoccupation and Compulsive Use. This follows Caplan's (2010) theoretical model where cognitive preoccupation and compulsive use together constitute deficient self-regulation.

**Implementation:** `engine.ts:74` — the DSR gate fires only when both `CP` and `CU` keys exist in the dimension scores map, preventing false activation for other instruments.

## 3. Interpretation Scheme

### 3a. Total-Score Interpretation (Mean-Anchored)

The heuristic 3-tier cutoffs (15–34 / 35–52 / 53–75) that previously existed had no traceable published source in any GPIUS-2 validation study. They were retired and replaced with a mean-anchored scheme referencing the Jakarta student sample (X̄=43.41, N=474) from R&S 2016 Table 3.

| Range | Label (Indonesian) | Severity | Anchor |
|---|---|---|---|
| 15–43 | Di Bawah Rata-Rata Referensi | `low` | ≤ X̄ |
| 44–58 | Sekitar Rata-Rata Referensi | `moderate` | X̄ to X̄+1SD |
| 59–75 | Di Atas Rata-Rata Referensi | `high` | > X̄+1SD |

### 3b. Per-Subscale Interpretation (Mean-Anchored)

18 rows (6 dimensions × 3 severity levels) anchored to R&S 2016 Table 3 subscale means:

| Dimension | Reference Mean | Below | At | Above |
|---|---|---|---|---|
| POSI | 7.26 | 3–7 | 8–11 | 12–15 |
| MR | 10.59 | 3–10 | 11–13 | 14–15 |
| CP | 8.76 | 3–8 | 9–12 | 13–15 |
| CU | 9.07 | 3–9 | 10–12 | 13–15 |
| NO | 7.74 | 3–7 | 8–11 | 12–15 |
| DSR | 17.83 (CP+CU) | 6–17 | 18–24 | 25–30 |

> [!NOTE]
> All reference means sourced from Reynaldo & Sokang (2016), Table 3. DSR reference = CP_mean + CU_mean = 8.76 + 9.07 = 17.83.

## 4. Citation Inventory

| # | Type | Citation | DOI |
|---|---|---|---|
| 1 | Original Instrument | Caplan, S. E. (2010). Theory and measurement of generalized problematic Internet use… *Computers in Human Behavior, 26*(5), 1089–1097. | `10.1016/j.chb.2010.03.026` |
| 2 | Theoretical Foundation | Caplan, S. E. (2002). Problematic Internet use and psychosocial well-being… *Computers in Human Behavior, 18*(5), 553–575. | `10.1016/S0747-5632(02)00004-3` |
| 3 | Indonesian Adaptation | Reynaldo, R., & Sokang, Y. A. (2016). Mahasiswa dan internet: Dua sisi mata uang? *Jurnal Psikologi (UGM), 43*(2), 107–120. | `10.22146/jpsi.17276` |

## 5. Implementation Verification

| Check | Status | Evidence |
|---|---|---|
| Scale range (1–5) matches seed description | ✅ | `seed.ts:96` — "Likert 5 poin (1–5)" |
| 15 items × 5 options = max 75 | ✅ | `engine.ts` computes from option bounds |
| DSR = CP + CU (second-order rollup) | ✅ | `engine.ts:74`, test coverage at `engine.test.ts:192` |
| DSR gate does NOT fire for other instruments | ✅ | Negative tests at `engine.test.ts:208+` |
| Adaptation citation (Reynaldo 2016) present | ✅ | `seed.ts:461-469` |
| Heuristic cutoffs retired | ✅ | No rows with unsourced thresholds remain |
| Mean-anchored total-score rows seeded (3) | ✅ | `interpretations.ts`, verified via DB query |
| Per-subscale interpretation rows seeded (18) | ✅ | 6 dimensions × 3 levels, verified via DB query |
| DSR denominator renders correctly (18/30) | ✅ | Browser verification, commit `e60742c` |
| dimensionMaxScores persisted in JSONB | ✅ | `sessions.ts`, engine test coverage |

## 6. DSR Denominator Fix (commit `e60742c`)

**Root cause:** `ScoreVisualizer` received no `dimensionMaxScores` prop, so it fell back to `inferredMax = max(all dimension raw scores)`. For DSR (a derived dimension with no direct questions), this equalled DSR's own value (e.g. 18), making DSR display as 18/18 (100%) instead of 18/30 (60%).

**Fix chain:** `engine.ts` → `assessment.ts` → `sessions.ts` → `results/[scoreId]/page.tsx` → `ResultsDashboard.tsx` → `ScoreVisualizer.tsx`. The engine now accumulates per-dimension theoretical maximums and persists them in the `computedScores` JSONB payload.

## 7. Known Limitations

1. **Pre-fix UI limitation.** Results submitted before commit `e60742c` display DSR with an incorrect denominator (18/18 instead of 18/30) in the visual charts. New submissions are correct.
2. **No published clinical cutoffs.** The mean-anchored thresholds are distribution-based reference points, not empirically validated diagnostic cutoffs. Future work should consider norm-referencing against a representative Indonesian sample.
3. **No percentile normative data.** Future enhancement could include percentile tables based on Indonesian university samples.
4. **SRS subscale interpretations remain TODO.** Manning et al. (2016) subscale thresholds pending documentation finalization.

---

*Audit prepared as part of the Scoring Engine Clinical Remediation (Phase A, Stage 4a).*
*Status updated to 🟢 ALL ISSUES RESOLVED on 2026-05-19.*
