/**
 * Lengan 1 — exhaustive coverage verification: PSS-10 (Perceived Stress Scale).
 *
 * Characterizes the FROZEN scoring engine + configuration (FREEZE_RECORD.md,
 * commit fbcbac3); these tests must never drive changes into the engine.
 *
 * Ground truth:
 *   - 10 items, Likert 0–4; reversed items {4,5,7,8} (reversal: 4 − raw):
 *     Cohen, Kamarck & Mermelstein (1983).
 *   - Dimensions: Helplessness {1,2,3,6,9,10} (0–24), Self-Efficacy {4,5,7,8}
 *     (0–16, post-reversal); factor allocation confirmed by the Indonesian
 *     validation, Hakim et al. (2024), JP3I 13(2):117–129.
 *   - Bands (live-DB audit, PROJECT_SCAN_FINDINGS §5 Q4; frozen per
 *     FREEZE_RECORD §1): total 0–13/14–26/27–40; Helplessness 0–8/9–16/17–24;
 *     Self-Efficacy 0–5/6–10/11–16 (higher post-reversal score = LESS
 *     self-efficacy, so severity rises with the score).
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

const qs = engineQuestions("pss10");
const ordersOf = (dim: string) => qs.flatMap((q, i) => (q.dimension === dim ? [i + 1] : []));

describe("PSS-10 — frozen configuration structure (scan Q2/Q3)", () => {
  it("has 10 items, reversed set {4,5,7,8}, options 0–4 on every item", () => {
    expect(qs).toHaveLength(10);
    const reversedOrders = qs.flatMap((q, i) => (q.isReversed ? [i + 1] : []));
    expect(reversedOrders).toEqual([4, 5, 7, 8]);
    for (const q of qs) {
      expect(q.options.map((o) => o.value).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it("dimensions: Helplessness {1,2,3,6,9,10}, Self-Efficacy {4,5,7,8}", () => {
    expect(ordersOf("Helplessness")).toEqual([1, 2, 3, 6, 9, 10]);
    expect(ordersOf("Self-Efficacy")).toEqual([4, 5, 7, 8]);
  });
});

describe("PSS-10 — reversal correctness (Cohen et al. 1983: items 4,5,7,8, reversed as 4 − raw)", () => {
  // 0→4 and 4→0 (bounds), 2→2 (self-inverse midpoint), per each reversed item's
  // real configured options.
  it.each([
    [4, 0, 4],
    [4, 4, 0],
    [4, 2, 2],
    [5, 0, 4],
    [5, 4, 0],
    [5, 2, 2],
    [7, 0, 4],
    [7, 4, 0],
    [7, 2, 2],
    [8, 0, 4],
    [8, 4, 0],
    [8, 2, 2],
  ])("item %i: raw %i → reversed %i", (order, raw, expected) => {
    expect(reverseScore(raw, qs[order - 1]!.options)).toBe(expected);
  });
});

describe("PSS-10 — total-score bands 0–13 / 14–26 / 27–40 (Cohen et al. 1983; scan Q4)", () => {
  // Both sides of the 13→14 and 26→27 boundaries, plus the 0 and 40 extremes.
  it.each([
    [0, "low", "Stres Rendah"],
    [13, "low", "Stres Rendah"],
    [14, "moderate", "Stres Sedang"],
    [26, "moderate", "Stres Sedang"],
    [27, "high", "Stres Tinggi"],
    [40, "high", "Stres Tinggi"],
  ])("post-reversal total %i → severity %s (%s)", (target, severity, label) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, null, target));
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(target);
    const band = classifyOne("pss10", result.totalScore);
    expect(band.severity).toBe(severity);
    expect(band.label).toBe(label);
  });

  it("anchor (explicit raw answers): 13→14 boundary reached through reversed items", () => {
    // Raw by item order:      1  2  3  4  5  6  7  8  9  10
    const answers = answersFromRaw(qs, [4, 4, 4, 2, 4, 0, 4, 4, 0, 0]);
    // Post-reversal: 4+4+4 + (4−2) + (4−4) + 0 + (4−4) + (4−4) + 0 + 0
    //              = 12 + 2 + 0 + 0 + 0 + 0 = 14 → Stres Sedang.
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(14);
    expect(classifyOne("pss10", 14).severity).toBe("moderate");
  });
});

describe("PSS-10 — Helplessness bands 0–8 / 9–16 / 17–24 (Hakim et al. 2024; scan Q4)", () => {
  it.each([
    [0, "low"],
    [8, "low"],
    [9, "moderate"],
    [16, "moderate"],
    [17, "high"],
    [24, "high"],
  ])("Helplessness score %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, ["Helplessness"], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["Helplessness"]).toBe(target);
    expect(classifyOne("pss10", target, "Helplessness").severity).toBe(severity);
  });
});

describe("PSS-10 — Self-Efficacy bands 0–5 / 6–10 / 11–16, severity rises with score (scan Q4)", () => {
  // The Self-Efficacy items ARE the reversed set {4,5,7,8}, so these patterns
  // also exercise reversal inside computeScore end to end.
  it.each([
    [0, "low"],
    [5, "low"],
    [6, "moderate"],
    [10, "moderate"],
    [11, "high"],
    [16, "high"],
  ])("Self-Efficacy score %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, ["Self-Efficacy"], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["Self-Efficacy"]).toBe(target);
    expect(classifyOne("pss10", target, "Self-Efficacy").severity).toBe(severity);
  });
});

describe("PSS-10 — extremes (post-reversal all-0 and all-4)", () => {
  it("minimum pattern → total 0, Helplessness 0, Self-Efficacy 0, all bands low", () => {
    const answers = answersFromScored(qs, Array(10).fill(0));
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(0);
    expect(result.dimensionScores).toEqual({ Helplessness: 0, "Self-Efficacy": 0 });
    expect(result.maxPossibleScore).toBe(40);
    expect(result.dimensionMaxScores).toEqual({ Helplessness: 24, "Self-Efficacy": 16 });
    expect(classifyOne("pss10", 0).severity).toBe("low");
    expect(classifyOne("pss10", 0, "Helplessness").severity).toBe("low");
    expect(classifyOne("pss10", 0, "Self-Efficacy").severity).toBe("low");
  });

  it("maximum pattern → total 40, Helplessness 24, Self-Efficacy 16, all bands high", () => {
    const answers = answersFromScored(qs, Array(10).fill(4));
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(40);
    expect(result.dimensionScores).toEqual({ Helplessness: 24, "Self-Efficacy": 16 });
    expect(classifyOne("pss10", 40).severity).toBe("high");
    expect(classifyOne("pss10", 24, "Helplessness").severity).toBe("high");
    expect(classifyOne("pss10", 16, "Self-Efficacy").severity).toBe("high");
  });

  it("literal raw all-0 → total 16 (reversed items 4,5,7,8 each contribute 4)", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(10).fill(0)), questions: qs });
    // 6 straight items × 0 + 4 reversed items × (4 − 0) = 16
    expect(result.totalScore).toBe(16);
    expect(result.dimensionScores).toEqual({ Helplessness: 0, "Self-Efficacy": 16 });
  });

  it("literal raw all-4 → total 24 (reversed items each contribute 0)", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(10).fill(4)), questions: qs });
    // 6 straight items × 4 + 4 reversed items × (4 − 4) = 24
    expect(result.totalScore).toBe(24);
    expect(result.dimensionScores).toEqual({ Helplessness: 24, "Self-Efficacy": 0 });
  });
});

describe("PSS-10 — band completeness sweep (no gaps/overlaps under lookup semantics)", () => {
  it("every integer total 0–40 matches exactly one band", () => {
    for (let s = 0; s <= 40; s++) expect(classify("pss10", s), `total ${s}`).toHaveLength(1);
  });

  it("every integer Helplessness 0–24 and Self-Efficacy 0–16 matches exactly one band", () => {
    for (let s = 0; s <= 24; s++) {
      expect(classify("pss10", s, "Helplessness"), `Helplessness ${s}`).toHaveLength(1);
    }
    for (let s = 0; s <= 16; s++) {
      expect(classify("pss10", s, "Self-Efficacy"), `Self-Efficacy ${s}`).toHaveLength(1);
    }
  });
});
