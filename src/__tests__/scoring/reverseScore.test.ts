import { describe, it, expect } from "vitest";
import { reverseScore, computeScore } from "@/server/scoring/engine";

// ─── reverseScore unit tests ─────────────────────────────────────────

describe("reverseScore", () => {
  // ─── Likert-5 (values 0–4) ──────────────────────────────────────
  describe("Likert-5 (0–4)", () => {
    const opts = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];

    it("reverses 0 → 4", () => {
      expect(reverseScore(0, opts)).toBe(4);
    });

    it("reverses 4 → 0", () => {
      expect(reverseScore(4, opts)).toBe(0);
    });

    it("midpoint symmetry: 2 → 2", () => {
      expect(reverseScore(2, opts)).toBe(2);
    });

    it("reverses 1 → 3", () => {
      expect(reverseScore(1, opts)).toBe(3);
    });

    it("reverses 3 → 1", () => {
      expect(reverseScore(3, opts)).toBe(1);
    });
  });

  // ─── Likert-7 (values 0–6) ──────────────────────────────────────
  describe("Likert-7 (0–6)", () => {
    const opts = [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 },
      { value: 6 },
    ];

    it("reverses 1 → 5", () => {
      expect(reverseScore(1, opts)).toBe(5);
    });

    it("reverses 6 → 0", () => {
      expect(reverseScore(6, opts)).toBe(0);
    });

    it("reverses 0 → 6", () => {
      expect(reverseScore(0, opts)).toBe(6);
    });

    it("midpoint symmetry: 3 → 3", () => {
      expect(reverseScore(3, opts)).toBe(3);
    });
  });

  // ─── Binary (values 0–1) ────────────────────────────────────────
  describe("Binary (0–1)", () => {
    const opts = [{ value: 0 }, { value: 1 }];

    it("reverses 0 → 1", () => {
      expect(reverseScore(0, opts)).toBe(1);
    });

    it("reverses 1 → 0", () => {
      expect(reverseScore(1, opts)).toBe(0);
    });
  });

  // ─── 1-based scale (values 1–5) ─────────────────────────────────
  describe("1-based Likert (1–5)", () => {
    const opts = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];

    it("reverses 1 → 5", () => {
      expect(reverseScore(1, opts)).toBe(5);
    });

    it("reverses 5 → 1", () => {
      expect(reverseScore(5, opts)).toBe(1);
    });

    it("midpoint symmetry: 3 → 3", () => {
      expect(reverseScore(3, opts)).toBe(3);
    });
  });

  // ─── Error handling ─────────────────────────────────────────────
  it("throws on empty options array", () => {
    expect(() => reverseScore(2, [])).toThrowError("reverseScore: options array is empty");
  });
});

// ─── computeScore integration ────────────────────────────────────────

describe("computeScore — reversed scoring integration", () => {
  const likert5Opts = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];

  it("correctly scores a mixed set with reversed questions", () => {
    // Setup: 4 questions, q0 and q2 are reversed, weight 1.0 each
    //   q0: answer=4, reversed → 0
    //   q1: answer=3, direct  → 3
    //   q2: answer=1, reversed → 3
    //   q3: answer=2, direct  → 2
    // Expected total: 0 + 3 + 3 + 2 = 8
    const result = computeScore({
      answers: {
        q0: 4,
        q1: 3,
        q2: 1,
        q3: 2,
      },
      questions: [
        {
          id: "q0",
          dimension: null,
          isReversed: true,
          weight: 1,
          options: likert5Opts,
        },
        {
          id: "q1",
          dimension: null,
          isReversed: false,
          weight: 1,
          options: likert5Opts,
        },
        {
          id: "q2",
          dimension: null,
          isReversed: true,
          weight: 1,
          options: likert5Opts,
        },
        {
          id: "q3",
          dimension: null,
          isReversed: false,
          weight: 1,
          options: likert5Opts,
        },
      ],
    });

    expect(result.totalScore).toBe(8);

    // rawScores retains original values
    expect(result.rawScores).toEqual({ q0: 4, q1: 3, q2: 1, q3: 2 });

    // computedScores.perQuestion has post-reversal values
    const perQ = (result.computedScores as { perQuestion: Record<string, number> }).perQuestion;
    expect(perQ.q0).toBe(0); // reversed: 4 → 0
    expect(perQ.q1).toBe(3); // direct
    expect(perQ.q2).toBe(3); // reversed: 1 → 3
    expect(perQ.q3).toBe(2); // direct
  });

  it("dimensional scores use reversed values", () => {
    // q0 (dim-A, reversed): answer=4 → scored=0 → weighted=0×1=0
    // q1 (dim-A, direct):   answer=2 → scored=2 → weighted=2×1=2
    // q2 (dim-B, direct):   answer=3 → scored=3 → weighted=3×1=3
    // dim-A total: 0 + 2 = 2
    // dim-B total: 3
    const result = computeScore({
      answers: { q0: 4, q1: 2, q2: 3 },
      questions: [
        {
          id: "q0",
          dimension: "dim-A",
          isReversed: true,
          weight: 1,
          options: likert5Opts,
        },
        {
          id: "q1",
          dimension: "dim-A",
          isReversed: false,
          weight: 1,
          options: likert5Opts,
        },
        {
          id: "q2",
          dimension: "dim-B",
          isReversed: false,
          weight: 1,
          options: likert5Opts,
        },
      ],
    });

    expect(result.dimensionScores["dim-A"]).toBe(2);
    expect(result.dimensionScores["dim-B"]).toBe(3);
    expect(result.totalScore).toBe(5);
  });

  it("applies weight after reversal", () => {
    // q0 (reversed, weight=2): answer=1 → reversed=3 → weighted=3×2=6
    const result = computeScore({
      answers: { q0: 1 },
      questions: [
        {
          id: "q0",
          dimension: null,
          isReversed: true,
          weight: 2,
          options: likert5Opts,
        },
      ],
    });

    expect(result.totalScore).toBe(6);
  });

  it("skips reversal when isReversed=true but options are missing", () => {
    // Safety: if options aren't provided, fall through to direct scoring
    const result = computeScore({
      answers: { q0: 3 },
      questions: [
        {
          id: "q0",
          dimension: null,
          isReversed: true,
          weight: 1,
          // no options
        },
      ],
    });

    expect(result.totalScore).toBe(3); // direct, no reversal
  });

  it("handles {selected: N} object answers with reversal", () => {
    const result = computeScore({
      answers: { q0: { selected: 4 } },
      questions: [
        {
          id: "q0",
          dimension: null,
          isReversed: true,
          weight: 1,
          options: likert5Opts,
        },
      ],
    });

    expect(result.totalScore).toBe(0); // reversed: 4 → 0
  });
});
