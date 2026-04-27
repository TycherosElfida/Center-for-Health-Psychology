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
