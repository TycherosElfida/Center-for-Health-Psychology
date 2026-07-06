/**
 * Lengan 1 — exhaustive coverage verification: GPIUS-2 (Generalized Problematic
 * Internet Use Scale 2).
 *
 * Characterizes the FROZEN scoring engine + configuration (FREEZE_RECORD.md,
 * commit fbcbac3); these tests must never drive changes into the engine.
 *
 * Ground truth:
 *   - 15 items, Likert 1–5, NO reversed items: Caplan (2010), Computers in
 *     Human Behavior 26:1089–1097.
 *   - Subscales (3 items each, 3–15): POSI {1,6,11}, MR {2,7,12}, CP {3,8,13},
 *     CU {4,9,14}, NO {5,10,15}; second-order DSR = CP + CU exactly (6–30).
 *   - Bands (mean-anchored per Reynaldo & Sokang 2016 — co-authored by the
 *     platform's domain expert; live-DB audit PROJECT_SCAN_FINDINGS §5 Q4):
 *     total 15–43/44–58/59–75; POSI 3–7/8–11/12–15; MR 3–10/11–13/14–15;
 *     CP 3–8/9–12/13–15; CU 3–9/10–12/13–15; NO 3–7/8–11/12–15;
 *     DSR 6–17/18–24/25–30.
 *   - Specification-audit risk: LOW (highest confidence).
 */
import { describe, it, expect } from "vitest";
import { computeScore } from "@/server/scoring/engine";
import {
  answersFromRaw,
  answersFromScored,
  classify,
  classifyOne,
  engineQuestions,
  scoredTargeting,
} from "./lengan1-fixtures";

const qs = engineQuestions("gpius2");
const ordersOf = (dim: string) => qs.flatMap((q, i) => (q.dimension === dim ? [i + 1] : []));

describe("GPIUS-2 — frozen configuration structure (scan Q2/Q3)", () => {
  it("has 15 items, zero reversed, options 1–5 on every item", () => {
    expect(qs).toHaveLength(15);
    expect(qs.filter((q) => q.isReversed)).toHaveLength(0);
    for (const q of qs) {
      expect(q.options.map((o) => o.value).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it("interleaved Caplan structure: POSI {1,6,11}, MR {2,7,12}, CP {3,8,13}, CU {4,9,14}, NO {5,10,15}", () => {
    expect(ordersOf("POSI")).toEqual([1, 6, 11]);
    expect(ordersOf("MR")).toEqual([2, 7, 12]);
    expect(ordersOf("CP")).toEqual([3, 8, 13]);
    expect(ordersOf("CU")).toEqual([4, 9, 14]);
    expect(ordersOf("NO")).toEqual([5, 10, 15]);
  });
});

describe("GPIUS-2 — reversal is a no-op (isReversed=false path; scan Q2: no reversed items)", () => {
  it("per-question computed values are identical to raw answers for all 15 items", () => {
    // Non-uniform pattern so any accidental reversal would change a value.
    const raw = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
    const answers = answersFromRaw(qs, raw);
    const result = computeScore({ answers, questions: qs });
    const perQ = (result.computedScores as { perQuestion: Record<string, number> }).perQuestion;
    qs.forEach((q, i) => expect(perQ[q.id], `item ${i + 1}`).toBe(raw[i]));
    expect(result.totalScore).toBe(45); // 3 × (1+2+3+4+5)
    expect(result.dimensionScores).toEqual({ POSI: 3, MR: 6, CP: 9, CU: 12, NO: 15, DSR: 21 });
  });
});

describe("GPIUS-2 — total-score bands 15–43 / 44–58 / 59–75 (Reynaldo & Sokang 2016; scan Q4)", () => {
  // Both sides of the 43→44 and 58→59 boundaries, plus the 15 and 75 extremes.
  it.each([
    [15, "low"],
    [43, "low"],
    [44, "moderate"],
    [58, "moderate"],
    [59, "high"],
    [75, "high"],
  ])("total %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, null, target));
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(target);
    expect(classifyOne("gpius2", result.totalScore).severity).toBe(severity);
  });

  it("anchor (explicit raw answers): 43→44 boundary", () => {
    // Raw by item order (no reversal): 5×7 + 2 + 1×7 = 35 + 2 + 7 = 44 → moderate.
    const answers = answersFromRaw(qs, [5, 5, 5, 5, 5, 5, 5, 2, 1, 1, 1, 1, 1, 1, 1]);
    const result = computeScore({ answers, questions: qs });
    expect(result.totalScore).toBe(44);
    expect(classifyOne("gpius2", 44).severity).toBe("moderate");
  });
});

describe("GPIUS-2 — subscale bands, each subscale's own boundaries (scan Q4)", () => {
  // POSI 3–7/8–11/12–15 · MR 3–10/11–13/14–15 · CP 3–8/9–12/13–15 ·
  // CU 3–9/10–12/13–15 · NO 3–7/8–11/12–15. Both sides of every boundary
  // plus subscale floor (3) and ceiling (15).
  it.each([
    ["POSI", 3, "low"],
    ["POSI", 7, "low"],
    ["POSI", 8, "moderate"],
    ["POSI", 11, "moderate"],
    ["POSI", 12, "high"],
    ["POSI", 15, "high"],
    ["MR", 3, "low"],
    ["MR", 10, "low"],
    ["MR", 11, "moderate"],
    ["MR", 13, "moderate"],
    ["MR", 14, "high"],
    ["MR", 15, "high"],
    ["CP", 3, "low"],
    ["CP", 8, "low"],
    ["CP", 9, "moderate"],
    ["CP", 12, "moderate"],
    ["CP", 13, "high"],
    ["CP", 15, "high"],
    ["CU", 3, "low"],
    ["CU", 9, "low"],
    ["CU", 10, "moderate"],
    ["CU", 12, "moderate"],
    ["CU", 13, "high"],
    ["CU", 15, "high"],
    ["NO", 3, "low"],
    ["NO", 7, "low"],
    ["NO", 8, "moderate"],
    ["NO", 11, "moderate"],
    ["NO", 12, "high"],
    ["NO", 15, "high"],
  ])("%s score %i → severity %s", (dim, target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, [dim], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores[dim]).toBe(target);
    expect(classifyOne("gpius2", target, dim).severity).toBe(severity);
  });
});

describe("GPIUS-2 — DSR second-order rollup = CP + CU exactly (Caplan 2010; engine.ts:83-87)", () => {
  it("DSR equals CP+CU and NOT any other subscale combination", () => {
    // Scored by item order: POSI items = 1; MR = [5,5,3] (13); CP = [3,1,1] (5);
    // CU = [5,3,1] (9); NO = 1. Distinct sums make wrong rollups detectable.
    const answers = answersFromScored(qs, [1, 5, 3, 5, 1, 1, 5, 1, 3, 1, 1, 3, 1, 1, 1]);
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["CP"]).toBe(5);
    expect(result.dimensionScores["CU"]).toBe(9);
    expect(result.dimensionScores["MR"]).toBe(13);
    expect(result.dimensionScores["DSR"]).toBe(14); // CP + CU
    expect(result.dimensionScores["DSR"]).not.toBe(18); // CP + MR — wrong rollup
    expect(result.dimensionScores["DSR"]).not.toBe(22); // CU + MR — wrong rollup
    expect(result.dimensionScores["DSR"]).not.toBe(27); // CP + CU + MR — wrong rollup
  });

  it("DSR max = CP_max + CU_max = 30 with the real 15-item fixture", () => {
    const answers = answersFromScored(qs, Array(15).fill(1));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionMaxScores["DSR"]).toBe(30);
  });

  // DSR bands 6–17 / 18–24 / 25–30: both sides of 17→18 and 24→25 + extremes.
  it.each([
    [6, "low"],
    [17, "low"],
    [18, "moderate"],
    [24, "moderate"],
    [25, "high"],
    [30, "high"],
  ])("DSR score %i → severity %s", (target, severity) => {
    const answers = answersFromScored(qs, scoredTargeting(qs, ["CP", "CU"], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["DSR"]).toBe(target);
    expect(classifyOne("gpius2", target, "DSR").severity).toBe(severity);
  });
});

describe("GPIUS-2 — extremes", () => {
  it("all-1 → total 15, every subscale at floor 3, DSR 6, all bands low", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(15).fill(1)), questions: qs });
    expect(result.totalScore).toBe(15);
    expect(result.dimensionScores).toEqual({ POSI: 3, MR: 3, CP: 3, CU: 3, NO: 3, DSR: 6 });
    expect(result.maxPossibleScore).toBe(75);
    expect(result.dimensionMaxScores).toEqual({
      POSI: 15,
      MR: 15,
      CP: 15,
      CU: 15,
      NO: 15,
      DSR: 30,
    });
    expect(classifyOne("gpius2", 15).severity).toBe("low");
    for (const dim of ["POSI", "MR", "CP", "CU", "NO"]) {
      expect(classifyOne("gpius2", 3, dim).severity, dim).toBe("low");
    }
    expect(classifyOne("gpius2", 6, "DSR").severity).toBe("low");
  });

  it("all-5 → total 75, every subscale at ceiling 15, DSR 30, all bands high", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(15).fill(5)), questions: qs });
    expect(result.totalScore).toBe(75);
    expect(result.dimensionScores).toEqual({ POSI: 15, MR: 15, CP: 15, CU: 15, NO: 15, DSR: 30 });
    expect(classifyOne("gpius2", 75).severity).toBe("high");
    for (const dim of ["POSI", "MR", "CP", "CU", "NO"]) {
      expect(classifyOne("gpius2", 15, dim).severity, dim).toBe("high");
    }
    expect(classifyOne("gpius2", 30, "DSR").severity).toBe("high");
  });
});

describe("GPIUS-2 — band completeness sweep (no gaps/overlaps under lookup semantics)", () => {
  it("every integer total 15–75 matches exactly one band", () => {
    for (let s = 15; s <= 75; s++) expect(classify("gpius2", s), `total ${s}`).toHaveLength(1);
  });

  it("every integer subscale score 3–15 (×5 subscales) and DSR 6–30 matches exactly one band", () => {
    for (const dim of ["POSI", "MR", "CP", "CU", "NO"]) {
      for (let s = 3; s <= 15; s++) {
        expect(classify("gpius2", s, dim), `${dim} ${s}`).toHaveLength(1);
      }
    }
    for (let s = 6; s <= 30; s++) expect(classify("gpius2", s, "DSR"), `DSR ${s}`).toHaveLength(1);
  });
});
