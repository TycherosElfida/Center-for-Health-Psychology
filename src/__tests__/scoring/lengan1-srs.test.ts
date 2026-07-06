/**
 * Lengan 1 — exhaustive coverage verification: SRS (Smartphone Resilience
 * Scale / dean's 11-item adaptation of Manning et al. 2016).
 *
 * Characterizes the FROZEN scoring engine + configuration (FREEZE_RECORD.md,
 * commit fbcbac3); these tests must never drive changes into the engine.
 *
 * ⚠ SPECIFICATION-AUDIT RISK: HIGH. These tests verify the CURRENTLY
 * CONFIGURED behavior only — NOT that the configuration itself is
 * psychometrically valid. The three-subscale structure
 * (Control/Efficacy/Satisfaction) and the 12→11 item reduction are not
 * independently verifiable via public literature (Manning et al. 2016
 * published 12 items and treated the scale as unidimensional) and remain
 * pending direct domain-expert confirmation (PROJECT_SCAN_FINDINGS §9.1;
 * UNDERSTANDING_LOCK D8). Nothing here implies external validation of the
 * SRS scoring rules.
 *
 * Configured ground truth (live-DB audit, scan Q2–Q4; FREEZE_RECORD §2):
 *   - 11 items, Likert 1–6; reversed items {1,3,5,7,11} (reversal: 7 − raw).
 *   - Dimensions: Control {1,3,5,7,11} (5 items, post-reversal, 5–30 — the
 *     set is identical to the reversed-item set), Efficacy {6,8,10} (3–18),
 *     Satisfaction {2,4,9} (3–18).
 *   - Bands, INVERTED polarity (lower score = worse outcome = higher
 *     severity): total 11–33 high / 34–50 moderate / 51–66 low;
 *     Control 5–13/14–22/23–30; Efficacy 3–8/9–14/15–18;
 *     Satisfaction 3–8/9–14/15–18 (severity high/moderate/low ascending).
 */
import { describe, it, expect } from "vitest";
import { computeScore, reverseScore } from "@/server/scoring/engine";
import {
  answersFromRaw,
  answersFromScored,
  classify,
  classifyOne,
  engineQuestions,
  scoredTargeting,
} from "./lengan1-fixtures";

const qs = engineQuestions("srs");
const ordersOf = (dim: string) => qs.flatMap((q, i) => (q.dimension === dim ? [i + 1] : []));

describe("SRS — frozen configuration structure (scan Q2/Q3)", () => {
  it("has 11 items, reversed set {1,3,5,7,11}, options 1–6 on every item", () => {
    expect(qs).toHaveLength(11);
    const reversedOrders = qs.flatMap((q, i) => (q.isReversed ? [i + 1] : []));
    expect(reversedOrders).toEqual([1, 3, 5, 7, 11]);
    for (const q of qs) {
      expect(q.options.map((o) => o.value).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it("dimensions: Control {1,3,5,7,11} (identical to the reversed set), Efficacy {6,8,10}, Satisfaction {2,4,9}", () => {
    expect(ordersOf("Control")).toEqual([1, 3, 5, 7, 11]);
    expect(ordersOf("Efficacy")).toEqual([6, 8, 10]);
    expect(ordersOf("Satisfaction")).toEqual([2, 4, 9]);
  });
});

describe("SRS — reversal correctness (configured items 1,3,5,7,11, reversed as 7 − raw)", () => {
  // Bounds 1→6 and 6→1, plus 3→4 / 4→3 (integer scale — no true midpoint),
  // per each reversed item's real configured options.
  it.each([
    [1, 1, 6],
    [1, 6, 1],
    [1, 3, 4],
    [1, 4, 3],
    [3, 1, 6],
    [3, 6, 1],
    [3, 3, 4],
    [3, 4, 3],
    [5, 1, 6],
    [5, 6, 1],
    [5, 3, 4],
    [5, 4, 3],
    [7, 1, 6],
    [7, 6, 1],
    [7, 3, 4],
    [7, 4, 3],
    [11, 1, 6],
    [11, 6, 1],
    [11, 3, 4],
    [11, 4, 3],
  ])("item %i: raw %i → reversed %i", (order, raw, expected) => {
    expect(reverseScore(raw, qs[order - 1]!.options)).toBe(expected);
  });
});

describe("SRS — total-score bands 11–33 / 34–50 / 51–66, inverted polarity (configured; scan Q4)", () => {
  // Lower score = worse outcome: severity is high/moderate/low ascending.
  // Both sides of the 33→34 and 50→51 boundaries, plus the 11 and 66 extremes.
  it.each([
    [11, "high"],
    [33, "high"],
    [34, "moderate"],
    [50, "moderate"],
    [51, "low"],
    [66, "low"],
  ])("post-reversal total %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, null, target));
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(target);
    expect(classifyOne("srs", result.totalScore).severity).toBe(severity);
  });

  it("anchor (explicit raw answers): 33→34 boundary reached through reversed items", () => {
    // Raw by item order:      1  2  3  4  5  6  7  8  9  10 11
    const answers = answersFromRaw(qs, [1, 6, 1, 6, 3, 1, 6, 1, 1, 1, 6]);
    // Post-reversal (items 1,3,5,7,11 are 7−raw):
    // (7−1)+6+(7−1)+6+(7−3)+1+(7−6)+1+1+1+(7−6)
    //  = 6 + 6 + 6 + 6 + 4 + 1 + 1 + 1 + 1 + 1 + 1 = 34 → moderate.
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(34);
    expect(classifyOne("srs", 34).severity).toBe("moderate");
  });
});

describe("SRS — Control bands 5–13 / 14–22 / 23–30 (configured; scan Q4)", () => {
  // Control IS the reversed set, so these patterns also exercise reversal
  // inside computeScore end to end.
  it.each([
    [5, "high"],
    [13, "high"],
    [14, "moderate"],
    [22, "moderate"],
    [23, "low"],
    [30, "low"],
  ])("Control score %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, ["Control"], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["Control"]).toBe(target);
    expect(classifyOne("srs", target, "Control").severity).toBe(severity);
  });
});

describe("SRS — Efficacy bands 3–8 / 9–14 / 15–18 (configured; scan Q4)", () => {
  it.each([
    [3, "high"],
    [8, "high"],
    [9, "moderate"],
    [14, "moderate"],
    [15, "low"],
    [18, "low"],
  ])("Efficacy score %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, ["Efficacy"], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["Efficacy"]).toBe(target);
    expect(classifyOne("srs", target, "Efficacy").severity).toBe(severity);
  });
});

describe("SRS — Satisfaction bands 3–8 / 9–14 / 15–18 (configured; scan Q4)", () => {
  it.each([
    [3, "high"],
    [8, "high"],
    [9, "moderate"],
    [14, "moderate"],
    [15, "low"],
    [18, "low"],
  ])("Satisfaction score %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, ["Satisfaction"], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["Satisfaction"]).toBe(target);
    expect(classifyOne("srs", target, "Satisfaction").severity).toBe(severity);
  });
});

describe("SRS — extremes (post-reversal all-1 and all-6)", () => {
  it("minimum pattern → total 11 {Control 5, Efficacy 3, Satisfaction 3}, all bands high severity", () => {
    const answers = answersFromScored(qs, Array(11).fill(1));
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(11);
    expect(result.dimensionScores).toEqual({ Control: 5, Efficacy: 3, Satisfaction: 3 });
    expect(result.maxPossibleScore).toBe(66);
    expect(result.dimensionMaxScores).toEqual({ Control: 30, Efficacy: 18, Satisfaction: 18 });
    expect(classifyOne("srs", 11).severity).toBe("high");
    expect(classifyOne("srs", 5, "Control").severity).toBe("high");
    expect(classifyOne("srs", 3, "Efficacy").severity).toBe("high");
    expect(classifyOne("srs", 3, "Satisfaction").severity).toBe("high");
  });

  it("maximum pattern → total 66 {Control 30, Efficacy 18, Satisfaction 18}, all bands low severity", () => {
    const answers = answersFromScored(qs, Array(11).fill(6));
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(66);
    expect(result.dimensionScores).toEqual({ Control: 30, Efficacy: 18, Satisfaction: 18 });
    expect(classifyOne("srs", 66).severity).toBe("low");
    expect(classifyOne("srs", 30, "Control").severity).toBe("low");
    expect(classifyOne("srs", 18, "Efficacy").severity).toBe("low");
    expect(classifyOne("srs", 18, "Satisfaction").severity).toBe("low");
  });

  it("literal raw all-1 → total 36 (Control items 1,3,5,7,11 each reverse to 6)", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(11).fill(1)), questions: qs });
    // 5 reversed items × (7 − 1) + 6 straight items × 1 = 30 + 6 = 36
    expect(result.totalScore).toBe(36);
    expect(result.dimensionScores).toEqual({ Control: 30, Efficacy: 3, Satisfaction: 3 });
  });

  it("literal raw all-6 → total 41 (Control items each reverse to 1)", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(11).fill(6)), questions: qs });
    // 5 reversed items × (7 − 6) + 6 straight items × 6 = 5 + 36 = 41
    expect(result.totalScore).toBe(41);
    expect(result.dimensionScores).toEqual({ Control: 5, Efficacy: 18, Satisfaction: 18 });
  });
});

describe("SRS — band completeness sweep (no gaps/overlaps under lookup semantics)", () => {
  it("every integer total 11–66 matches exactly one band", () => {
    for (let s = 11; s <= 66; s++) expect(classify("srs", s), `total ${s}`).toHaveLength(1);
  });

  it("every integer Control 5–30, Efficacy 3–18, Satisfaction 3–18 matches exactly one band", () => {
    for (let s = 5; s <= 30; s++) {
      expect(classify("srs", s, "Control"), `Control ${s}`).toHaveLength(1);
    }
    for (let s = 3; s <= 18; s++) {
      expect(classify("srs", s, "Efficacy"), `Efficacy ${s}`).toHaveLength(1);
      expect(classify("srs", s, "Satisfaction"), `Satisfaction ${s}`).toHaveLength(1);
    }
  });
});
