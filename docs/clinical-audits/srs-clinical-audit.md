# SRS — Clinical Audit Document

**Instrument:** Simplified Resilience Score (SRS)
**Audit Date:** 2026-05-19
**Branch:** `srs-interpretation-scheme`
**Spec Reference:** v2 Clinical Reference Specification §3 (2026-05-08)
**Status:** 🟢 ALL ISSUES RESOLVED (data layer)

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

## 3. Interpretation Scheme

### 3a. Total-Score Interpretation

| Range | Label (Indonesian) | Severity   | Clinical Meaning              |
| ----- | ------------------ | ---------- | ----------------------------- |
| 11–33 | Resiliensi Rendah  | `high`     | Low resilience → high concern |
| 34–50 | Resiliensi Sedang  | `moderate` | Moderate resilience           |
| 51–66 | Resiliensi Tinggi  | `low`      | High resilience → low concern |

The thresholds follow a pragmatic tertile division of the 11–66 range, informed by Manning et al. (2016) distribution patterns and adapted for Indonesian context. No published clinical cutoff study exists specifically for the Indonesian adaptation of this composite instrument.

### 3b. Per-Subscale Interpretation (Heuristic Tertiles)

**No published normative data exists for this adaptation.** Bands represent theoretical tertiles of the scale range only — they describe where a score sits within the theoretical scale, not how it compares to a population sample. Unlike GPIUS-2 (which uses R&S 2016 Table 3 as a reference mean), SRS has no Indonesian population mean to anchor against.

| Subscale     | Range  | Band  | Label                  | Severity   |
| ------------ | ------ | ----- | ---------------------- | ---------- |
| Efficacy     | 3–18   | 3–8   | Efikasi Rendah         | `high`     |
| Efficacy     | 3–18   | 9–14  | Efikasi Sedang         | `moderate` |
| Efficacy     | 3–18   | 15–18 | Efikasi Tinggi         | `low`      |
| Satisfaction | 3–18   | 3–8   | Kepuasan Hidup Rendah  | `high`     |
| Satisfaction | 3–18   | 9–14  | Kepuasan Hidup Sedang  | `moderate` |
| Satisfaction | 3–18   | 15–18 | Kepuasan Hidup Tinggi  | `low`      |
| Control      | 5–30   | 5–13  | Rasa Kendali Rendah    | `high`     |
| Control      | 5–30   | 14–22 | Rasa Kendali Sedang    | `moderate` |
| Control      | 5–30   | 23–30 | Rasa Kendali Tinggi    | `low`      |

Polarity (inverted, matching total-score): high score → severity `low` → green. The Control subscale items (Q1, Q3, Q5, Q7, Q11) are reverse-scored at the item level; the post-reversal subscale score then follows standard polarity (high = high sense of control = good), with the SRS-wide severity inversion mapping high → `low`.

Disclosure note appended to each subscale's moderate-band description:

> "Catatan: Belum tersedia data normatif untuk populasi Indonesia untuk versi adaptasi skala ini. Skor ini mencerminkan posisi dalam rentang teoritis skala, bukan perbandingan dengan populasi tertentu."

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
| Per-subscale rows seeded (9)                    | ✅     | `interpretations.ts` — 9 rows w/ dimension Efficacy/Satisfaction/Control |
| Polarity: subscale high score = severity `low`  | ✅     | `interpretations.test.ts` — polarity assertions      |
| Disclosure note in moderate-band descriptions   | ✅     | All 3 subscales; tested via "Belum tersedia data normatif" match |
| Subscale bars render with denominators 18/18/30 | ✅     | Engine test `engine.test.ts` + browser-verified Phase C Stage 3 |

## 7. Known Limitations

1. **No published Indonesian validation study.** The SRS adaptation used on this platform is institution-specific (dean's office). No peer-reviewed Indonesian psychometric validation (CFA/IRT) has been identified.
2. **Thresholds are pragmatic tertiles.** The 11–33 / 34–50 / 51–66 total-score split and the per-subscale tertiles (Efficacy 3-8/9-14/15-18, Satisfaction 3-8/9-14/15-18, Control 5-13/14-22/23-30) are not derived from empirically validated clinical cutoffs.
3. **No normative reference data.** Unlike GPIUS-2 (which uses R&S 2016 Table 3 as a reference mean), SRS has no Indonesian population mean to anchor interpretation against. Bands are theoretical tertiles of the scale range. Accumulated platform data could provide a local reference mean over time.
4. **PENDING DEAN CONFIRMATION:** Which of Manning et al. (2016)'s 12 items was dropped to produce the 11-item form used here.
5. **PENDING DEAN CONFIRMATION:** Whether the 3-subscale structure (Efficacy / Satisfaction / Control) was introduced by the dean or derived from another published source. Current attribution traces Efficacy and Control to Pearlin & Schooler (1978) Mastery Scale and Satisfaction to Diener et al. (1985) SWLS, but the specific item-to-subscale mapping in the 11-item form is institution-specific.
6. **Per-subscale interpretation text rendering — PENDING PHASE D.** The 9 subscale interpretation rows are seeded in the DB and per-dimension lookups already populate `computedScores.dimensionInterpretations` at submit time ([sessions.ts:331-340](../../src/server/trpc/procedures/sessions.ts)). However, neither the user results page ([app/results/\[scoreId\]/page.tsx](../../src/app/results/[scoreId]/page.tsx)) nor the admin result detail extracts this data, so subscale description/recommendation text does not yet display under each bar. This is a platform-wide UI gap (also affects GPIUS-2's 18 subscale rows from Phase B) and is the explicit scope of Phase D (results UI polish).

---

_Audit prepared as part of the Scoring Engine Clinical Remediation. Total-score scheme: Phase A, Stage 4b. Per-subscale scheme: Phase C (srs-interpretation-scheme, 2026-05-19)._
