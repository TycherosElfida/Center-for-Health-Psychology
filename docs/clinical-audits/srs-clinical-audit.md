# SRS — Clinical Audit Document

**Instrument:** Simplified Resilience Score (SRS)
**Audit Date:** 2026-05-19
**Branch:** `scoring-engine-clinical-remediation`
**Spec Reference:** v2 Clinical Reference Specification §3 (2026-05-08)

---

## 1. Instrument Overview

| Property                  | Value                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Original Authors**      | Lydia K. Manning, Dawn C. Carr, & Ben Lennox Kail                                                     |
| **Year**                  | 2016                                                                                                  |
| **Derived From**          | Satisfaction With Life Scale (Diener et al., 1985) + Pearlin Mastery Scale (Pearlin & Schooler, 1978) |
| **Indonesian Adaptation** | Dean's office adaptation (institution-specific)                                                       |
| **Items**                 | 11                                                                                                    |
| **Scale**                 | Likert 6-point (1–6)                                                                                  |
| **Total Score Range**     | 11–66                                                                                                 |
| **Reversed Items**        | Q1, Q3, Q5, Q7, Q11 (formula: 7 − raw)                                                                |
| **Scoring Method**        | Summative with reverse scoring                                                                        |

## 2. Dimensional Structure

The SRS measures three constructs of psychological resilience:

| Dimension    | Items                    | Score Range | Source Instrument            |
| ------------ | ------------------------ | ----------- | ---------------------------- |
| Efficacy     | Q6, Q8, Q10             | 3–18        | Pearlin Mastery Scale        |
| Satisfaction | Q2, Q4, Q9               | 3–18        | Satisfaction With Life Scale |
| Control      | Q1\*, Q3\*, Q5\*, Q7\*, Q11\* | 5–30        | Pearlin Mastery Scale        |

\* Reversed items — scored as `7 − raw_value`

### Polarity Note

The SRS uses **standard polarity** (higher score = greater resilience = better outcome). However, **severity mapping is inverted** relative to clinical concern:

- High score → Low clinical concern → severity `low` → green
- Low score → High clinical concern → severity `high` → red

This is the opposite of PSS-10 and GPIUS-2, where high scores indicate worse outcomes.

## 3. Interpretation Thresholds

| Range | Label (Indonesian) | Severity   | Clinical Meaning              |
| ----- | ------------------ | ---------- | ----------------------------- |
| 11–33 | Resiliensi Rendah  | `high`     | Low resilience → high concern |
| 34–50 | Resiliensi Sedang  | `moderate` | Moderate resilience           |
| 51–66 | Resiliensi Tinggi  | `low`      | High resilience → low concern |

The thresholds follow a pragmatic tertile division of the 11–66 range, informed by Manning et al. (2016) distribution patterns and adapted for Indonesian context. No published clinical cutoff study exists specifically for the Indonesian adaptation of this composite instrument.

## 4. Reverse Scoring Verification

The engine applies reverse scoring via `reverseScore()` in `engine.ts`:

```
reverseScore(rawValue, maxOptionValue, minOptionValue)
  → maxOptionValue - rawValue + minOptionValue
  → For SRS: 6 - raw + 1 = 7 - raw
```

| Item                                         | Raw Answer              | Reversed Score | Rationale                                      |
| -------------------------------------------- | ----------------------- | -------------- | ---------------------------------------------- |
| Q1 ("Life is unpredictable…")                | 5 (Setuju)              | 2              | Negative framing → agreement = low mastery     |
| Q3 ("I have little control…")                | 1 (Sangat Tidak Setuju) | 6              | Negative framing → disagreement = high control |
| Q5 ("What happens to me is beyond control…") | 3 (Agak Tidak Setuju)   | 4              | Moderate disagreement = moderate control       |

## 5. Citation Inventory

| #   | Type                | Citation                                                                                                                                            | DOI                           |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | Original Instrument | Manning, L. K., Carr, D. C., & Kail, B. L. (2016). Do higher levels of resilience buffer…_The Gerontologist, 56_(3), 514–524.                       | `10.1093/geront/gnu068`       |
| 2   | Source Instrument   | Diener, E., Emmons, R. A., Larsen, R. J., & Griffin, S. (1985). The Satisfaction With Life Scale._Journal of Personality Assessment, 49_(1), 71–75. | `10.1207/s15327752jpa4901_13` |
| 3   | Source Instrument   | Pearlin, L. I., & Schooler, C. (1978). The structure of coping._Journal of Health and Social Behavior, 19_(1), 2–21.                                | `10.2307/2136319`             |

### Important Distinction

The SRS (Simplified Resilience Score) by Manning et al. (2016) is a **different instrument** from the BRS (Brief Resilience Scale) by Smith et al. (2008). The BRS is a 6-item, 5-point unidimensional measure of "bouncing back." The SRS is an 11-item, 6-point three-dimensional composite drawn from the SWLS and Pearlin Mastery Scale. The CHP platform implements the SRS per the dean's institutional adaptation.

## 6. Implementation Verification

| Check                                           | Status | Evidence                                             |
| ----------------------------------------------- | ------ | ---------------------------------------------------- |
| Scale range (1–6) matches seed description      | ✅     | `seed.ts:118` — "Likert 6 poin (1–6)"                |
| 11 items × 6 options = max 66                   | ✅     | `engine.ts` computes from option bounds              |
| Reversed items (Q1,3,5,7,11) correctly inverted | ✅     | `reverseScore()` → 7 − raw                           |
| Polarity: high score = low severity (green)     | ✅     | `interpretations.ts:249` — severity "low" for 51–66  |
| Polarity: low score = high severity (red)       | ✅     | `interpretations.ts:223` — severity "high" for 11–33 |
| 3 subscales correctly assigned                  | ✅     | Efficacy/Satisfaction/Control dimensions in seed     |
| DSR gate does NOT fire for SRS                  | ✅     | Negative test at `engine.test.ts:235+`               |
| Attribution: Manning (2016) not Smith (2008)    | ✅     | `seed.ts:129` — "Lydia K. Manning…"                  |
| Source citations (Diener, Pearlin) present      | ✅     | `seed.ts:478-495`                                    |

## 7. Known Limitations

1. **No published Indonesian validation study.** The SRS adaptation used on this platform is institution-specific (dean's office). No peer-reviewed Indonesian psychometric validation (CFA/IRT) has been identified.
2. **Thresholds are pragmatic tertiles.** The 11–33 / 34–50 / 51–66 split is not derived from empirically validated clinical cutoffs.
3. **No per-dimension interpretation rows.** The platform provides total-score interpretation only. Per-dimension thresholds (e.g., "low Efficacy with high Satisfaction") are not seeded.
4. **No normative data.** Percentile tables or comparison norms for Indonesian populations are not available.

---

_Audit prepared as part of the Scoring Engine Clinical Remediation (Phase A, Stage 4b)._
