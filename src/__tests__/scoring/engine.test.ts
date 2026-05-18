import { describe, it, expect } from "vitest";
import { computeScore } from "@/server/scoring/engine";

/* ═══════════════════════════════════════════════════════
   Weight NaN Guard (T1A.3)
   ═══════════════════════════════════════════════════════ */

describe("computeScore — weight NaN guard", () => {
  it("treats NaN weight as 1.0 and scores correctly", () => {
    const result = computeScore({
      answers: { q1: 3 },
      questions: [
        {
          id: "q1",
          dimension: null,
          isReversed: false,
          weight: NaN,
          options: [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        },
      ],
    });
    expect(result.totalScore).toBe(3); // 3 * 1.0 (fallback)
  });

  it("applies valid weight normally", () => {
    const result = computeScore({
      answers: { q1: 2 },
      questions: [
        {
          id: "q1",
          dimension: null,
          isReversed: false,
          weight: 2.5,
          options: [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        },
      ],
    });
    expect(result.totalScore).toBe(5); // 2 * 2.5
  });

  it("treats weight=0 as valid (not NaN)", () => {
    const result = computeScore({
      answers: { q1: 4 },
      questions: [
        {
          id: "q1",
          dimension: null,
          isReversed: false,
          weight: 0,
          options: [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        },
      ],
    });
    expect(result.totalScore).toBe(0); // 4 * 0
  });
});

/* ═══════════════════════════════════════════════════════
   maxPossibleScore Derivation (T1A.8)
   ═══════════════════════════════════════════════════════ */

describe("computeScore — maxPossibleScore derivation", () => {
  const opts5 = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];
  const binary = [{ value: 0 }, { value: 1 }];

  it("computes max from option bounds × weight for Likert-5", () => {
    const result = computeScore({
      answers: { q1: 2, q2: 3 },
      questions: [
        { id: "q1", dimension: null, isReversed: false, weight: 1, options: opts5 },
        { id: "q2", dimension: null, isReversed: false, weight: 1, options: opts5 },
      ],
    });
    expect(result.maxPossibleScore).toBe(8); // 4 * 1 + 4 * 1
  });

  it("accounts for weight in maxPossibleScore", () => {
    const result = computeScore({
      answers: { q1: 2 },
      questions: [{ id: "q1", dimension: null, isReversed: false, weight: 2.0, options: opts5 }],
    });
    expect(result.maxPossibleScore).toBe(8); // 4 * 2.0
  });

  it("handles binary (0/1) options", () => {
    const result = computeScore({
      answers: { q1: 1, q2: 0, q3: 1 },
      questions: [
        { id: "q1", dimension: null, isReversed: false, weight: 1, options: binary },
        { id: "q2", dimension: null, isReversed: false, weight: 1, options: binary },
        { id: "q3", dimension: null, isReversed: false, weight: 1, options: binary },
      ],
    });
    expect(result.maxPossibleScore).toBe(3); // 1 * 1 * 3
  });

  it("uses safeWeight (1.0) for NaN weight in maxScore calculation", () => {
    const result = computeScore({
      answers: { q1: 2 },
      questions: [{ id: "q1", dimension: null, isReversed: false, weight: NaN, options: opts5 }],
    });
    expect(result.maxPossibleScore).toBe(4); // 4 * 1.0 (NaN → 1.0)
  });
});

/* ═══════════════════════════════════════════════════════
   Hand-Calculated Reference Scores (T1A.9)
   ═══════════════════════════════════════════════════════ */

describe("computeScore — PSS-10 hand-calculated", () => {
  const opts5 = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];

  it("all zeros = 0", () => {
    const qs = Array.from({ length: 10 }, (_, i) => ({
      id: `pss-${i}`,
      dimension: null,
      isReversed: false,
      weight: 1,
      options: opts5,
    }));
    const answers = Object.fromEntries(qs.map((q) => [q.id, 0]));
    expect(computeScore({ answers, questions: qs }).totalScore).toBe(0);
  });

  it("all max = 40", () => {
    const qs = Array.from({ length: 10 }, (_, i) => ({
      id: `pss-${i}`,
      dimension: null,
      isReversed: false,
      weight: 1,
      options: opts5,
    }));
    const answers = Object.fromEntries(qs.map((q) => [q.id, 4]));
    expect(computeScore({ answers, questions: qs }).totalScore).toBe(40);
  });

  it("reversed items invert correctly", () => {
    const qs = [
      { id: "q1", dimension: null, isReversed: false, weight: 1, options: opts5 },
      { id: "q2", dimension: null, isReversed: true, weight: 1, options: opts5 },
    ];
    const answers = { q1: 4, q2: 4 };
    // q1: 4, q2 reversed: (4 - 4) + 0 = 0, total = 4
    expect(computeScore({ answers, questions: qs }).totalScore).toBe(4);
  });

  it("maxPossibleScore for 10 Likert-5 items = 40", () => {
    const qs = Array.from({ length: 10 }, (_, i) => ({
      id: `pss-${i}`,
      dimension: null,
      isReversed: false,
      weight: 1,
      options: opts5,
    }));
    const answers = Object.fromEntries(qs.map((q) => [q.id, 2]));
    expect(computeScore({ answers, questions: qs }).maxPossibleScore).toBe(40);
  });
});

describe("computeScore — SRQ-29 dimensional grouping", () => {
  const binary = [{ value: 0 }, { value: 1 }];

  it("groups scores by dimension correctly", () => {
    const qs = [
      { id: "n1", dimension: "neurotic", isReversed: false, weight: 1, options: binary },
      { id: "n2", dimension: "neurotic", isReversed: false, weight: 1, options: binary },
      { id: "s1", dimension: "substance", isReversed: false, weight: 1, options: binary },
    ];
    const answers = { n1: 1, n2: 1, s1: 0 };
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["neurotic"]).toBe(2);
    expect(result.dimensionScores["substance"]).toBe(0);
    expect(result.totalScore).toBe(2);
  });

  it("maxPossibleScore for 29 binary items = 29", () => {
    const qs = Array.from({ length: 29 }, (_, i) => ({
      id: `srq-${i}`,
      dimension: "neurotic",
      isReversed: false,
      weight: 1,
      options: binary,
    }));
    const answers = Object.fromEntries(qs.map((q) => [q.id, 1]));
    expect(computeScore({ answers, questions: qs }).maxPossibleScore).toBe(29);
  });
});

describe("computeScore — second-order dimensional rollups", () => {
  const binary = [{ value: 0 }, { value: 1 }];

  it("calculates DSR as the sum of CP and CU dimensions", () => {
    const qs = [
      { id: "cp1", dimension: "CP", isReversed: false, weight: 1, options: binary },
      { id: "cp2", dimension: "CP", isReversed: false, weight: 1, options: binary },
      { id: "cu1", dimension: "CU", isReversed: false, weight: 1, options: binary },
      { id: "no1", dimension: "NO", isReversed: false, weight: 1, options: binary }, // Shouldn't affect DSR
    ];
    // CP = 2, CU = 1, NO = 1 -> DSR should be 3
    const answers = { cp1: 1, cp2: 1, cu1: 1, no1: 1 };
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["CP"]).toBe(2);
    expect(result.dimensionScores["CU"]).toBe(1);
    expect(result.dimensionScores["NO"]).toBe(1);
    expect(result.dimensionScores["DSR"]).toBe(3);
  });

  it("exposes dimensionMaxScores with DSR max = CP_max + CU_max", () => {
    // GPIUS-2 uses a 1–5 Likert scale. 3 CP questions + 3 CU questions.
    // DSR = CP + CU, so DSR_max = 3×5 + 3×5 = 30. NOT 18 (the raw score).
    const opts15 = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];
    const qs = [
      { id: "cp1", dimension: "CP", isReversed: false, weight: 1, options: opts15 },
      { id: "cp2", dimension: "CP", isReversed: false, weight: 1, options: opts15 },
      { id: "cp3", dimension: "CP", isReversed: false, weight: 1, options: opts15 },
      { id: "cu1", dimension: "CU", isReversed: false, weight: 1, options: opts15 },
      { id: "cu2", dimension: "CU", isReversed: false, weight: 1, options: opts15 },
      { id: "cu3", dimension: "CU", isReversed: false, weight: 1, options: opts15 },
      { id: "no1", dimension: "NO", isReversed: false, weight: 1, options: opts15 },
      { id: "no2", dimension: "NO", isReversed: false, weight: 1, options: opts15 },
      { id: "no3", dimension: "NO", isReversed: false, weight: 1, options: opts15 },
    ];
    // All 3s → CP=9, CU=9, NO=9, DSR=18
    const answers = Object.fromEntries(qs.map((q) => [q.id, 3]));
    const result = computeScore({ answers, questions: qs });

    // Scores correct
    expect(result.dimensionScores["CP"]).toBe(9);
    expect(result.dimensionScores["CU"]).toBe(9);
    expect(result.dimensionScores["DSR"]).toBe(18);

    // Max scores: each primary dimension max = count × 5
    expect(result.dimensionMaxScores["CP"]).toBe(15); // 3 × 5
    expect(result.dimensionMaxScores["CU"]).toBe(15); // 3 × 5
    expect(result.dimensionMaxScores["NO"]).toBe(15); // 3 × 5
    // DSR max = CP_max + CU_max = 15 + 15 = 30 (NOT 18)
    expect(result.dimensionMaxScores["DSR"]).toBe(30);
  });

  it("exposes dimensionMaxScores for non-DSR instruments without a DSR key", () => {
    const opts5 = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];
    const qs = [
      { id: "h1", dimension: "Helplessness", isReversed: false, weight: 1, options: opts5 },
      { id: "h2", dimension: "Helplessness", isReversed: false, weight: 1, options: opts5 },
      { id: "se1", dimension: "Self-Efficacy", isReversed: true, weight: 1, options: opts5 },
    ];
    const answers = { h1: 3, h2: 2, se1: 1 };
    const result = computeScore({ answers, questions: qs });

    expect(result.dimensionMaxScores["Helplessness"]).toBe(8); // 2 × 4
    expect(result.dimensionMaxScores["Self-Efficacy"]).toBe(4); // 1 × 4
    expect(result.dimensionMaxScores).not.toHaveProperty("DSR");
  });

  it("does NOT produce DSR for PSS-10 dimensions (Helplessness/Self-Efficacy)", () => {
    const opts5 = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];
    const qs = [
      { id: "h1", dimension: "Helplessness", isReversed: false, weight: 1, options: opts5 },
      { id: "h2", dimension: "Helplessness", isReversed: false, weight: 1, options: opts5 },
      { id: "se1", dimension: "Self-Efficacy", isReversed: true, weight: 1, options: opts5 },
    ];
    const answers = { h1: 3, h2: 2, se1: 1 };
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["Helplessness"]).toBe(5);
    expect(result.dimensionScores["Self-Efficacy"]).toBe(3); // reversed: 4 - 1 + 0 = 3
    expect(result.dimensionScores).not.toHaveProperty("DSR");
  });

  it("does NOT produce DSR for SRQ-29 dimensions (neurotic/substance/psychotic/ptsd)", () => {
    const binary = [{ value: 0 }, { value: 1 }];
    const qs = [
      { id: "n1", dimension: "neurotic", isReversed: false, weight: 1, options: binary },
      { id: "s1", dimension: "substance", isReversed: false, weight: 1, options: binary },
      { id: "p1", dimension: "psychotic", isReversed: false, weight: 1, options: binary },
      { id: "t1", dimension: "ptsd", isReversed: false, weight: 1, options: binary },
    ];
    const answers = { n1: 1, s1: 1, p1: 0, t1: 1 };
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores).not.toHaveProperty("DSR");
    expect(result.dimensionScores).not.toHaveProperty("CP");
    expect(result.dimensionScores).not.toHaveProperty("CU");
  });

  it("does NOT produce DSR for SRS dimensions (Efficacy/Satisfaction/Control)", () => {
    const opts6 = [
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 },
      { value: 6 },
    ];
    const qs = [
      { id: "e1", dimension: "Efficacy", isReversed: false, weight: 1, options: opts6 },
      { id: "s1", dimension: "Satisfaction", isReversed: false, weight: 1, options: opts6 },
      { id: "c1", dimension: "Control", isReversed: true, weight: 1, options: opts6 },
    ];
    const answers = { e1: 4, s1: 5, c1: 2 };
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores).not.toHaveProperty("DSR");
    expect(result.dimensionScores).not.toHaveProperty("CP");
    expect(result.dimensionScores).not.toHaveProperty("CU");
  });
});
