# GPIUS-2 — Clinical Audit Document

**Instrument:** Generalized Problematic Internet Use Scale 2 (GPIUS-2)  
**Audit Date:** 2026-05-19  
**Branch:** `scoring-engine-clinical-remediation`  
**Spec Reference:** v2 Clinical Reference Specification §2 (2026-05-08)

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

## 3. Interpretation Thresholds

| Range | Label (Indonesian) | Severity |
|---|---|---|
| 15–34 | Penggunaan Internet Normal | `low` |
| 35–52 | Penggunaan Internet Bermasalah Ringan | `moderate` |
| 53–75 | Penggunaan Internet Bermasalah Tinggi | `high` |

> [!WARNING]  
> **Cutoff Source Disclaimer:** The three-tier cutoffs (≤34 / 35–52 / 53–75) are distribution-based heuristics derived from the Indonesian adaptation by Reynaldo & Sokang (2016). No published clinical validation study exists that establishes these specific thresholds as clinically diagnostic. Caplan (2010) originally reported means and standard deviations but did not propose categorical cutoffs.

These ranges should be interpreted as **screening indicators**, not clinical diagnoses. Future work should consider norm-referencing against a representative Indonesian sample.

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
| Cutoff disclaimer present | ✅ | `interpretations.ts:172-180` |
| Adaptation citation (Reynaldo 2016) present | ✅ | `seed.ts:461-469` |

## 6. Known Limitations

1. **No per-dimension interpretation rows.** The platform currently provides total-score interpretation only. Per-dimension interpretations (e.g., "high POSI with normal NO") are not seeded.
2. **No published clinical cutoffs.** The thresholds used are consensus-derived, not empirically validated against Indonesian clinical populations.
3. **No percentile normative data.** Future enhancement could include percentile tables based on Indonesian university samples.

---

*Audit prepared as part of the Scoring Engine Clinical Remediation (Phase A, Stage 4a).*
